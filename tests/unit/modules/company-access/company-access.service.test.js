import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCompanyAccessService } from '../../../../src/modules/company-access/company-access.service.js';

const now = new Date('2026-08-10T12:00:00.000Z');
const ownerMembership = {
  id: 10,
  companyId: 1,
  userId: 20,
  status: 'ACTIVE',
  securityVersion: 1,
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
  roles: [{ role: { id: 30, code: 'OWNER' } }],
};

describe('company access service', () => {
  let repository;
  let service;

  beforeEach(() => {
    repository = {
      findCompany: vi.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
      findActiveCompany: vi.fn().mockResolvedValue({ id: 1 }),
      findUserByEmail: vi.fn().mockResolvedValue({ id: 20, status: 'ACTIVE' }),
      findRolesByIds: vi.fn().mockResolvedValue([{ id: 30, code: 'OWNER' }]),
      countActiveMemberships: vi.fn().mockResolvedValue(0),
      countActiveOwners: vi.fn().mockResolvedValue(1),
      createMembership: vi.fn().mockResolvedValue(ownerMembership),
      findMembership: vi.fn().mockResolvedValue(ownerMembership),
      updateMembershipStatus: vi.fn(),
      replaceMembershipRoles: vi.fn(),
    };
    service = createCompanyAccessService({
      repository,
      entityChangeService: { record: vi.fn() },
      runInTransaction: (operation) => operation({ transaction: true }),
    });
  });

  it('requires the first active membership to be an owner', async () => {
    repository.findRolesByIds.mockResolvedValue([{ id: 31, code: 'ADMIN' }]);

    await expect(
      service.addMembership(
        1,
        { email: 'owner@example.test', roleIds: [31] },
        9,
        { actorUserId: 9, requestId: 'request-1' },
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' });
    expect(repository.createMembership).not.toHaveBeenCalled();
  });

  it('rejects role identifiers from another company', async () => {
    repository.findRolesByIds.mockResolvedValue([]);

    await expect(
      service.addMembership(
        1,
        { email: 'owner@example.test', roleIds: [999] },
        9,
        { actorUserId: 9, requestId: 'request-2' },
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { invalidRoleIds: [999] },
    });
  });

  it('prevents suspension of the final active owner', async () => {
    await expect(
      service.changeMembershipStatus(
        1,
        10,
        { status: 'SUSPENDED', expectedUpdatedAt: now.toISOString() },
        { actorUserId: 9, requestId: 'request-3' },
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' });
    expect(repository.updateMembershipStatus).not.toHaveBeenCalled();
  });

  it('prevents replacing the final owner role', async () => {
    repository.findRolesByIds.mockResolvedValue([{ id: 31, code: 'ADMIN' }]);

    await expect(
      service.replaceMembershipRoles(
        1,
        10,
        { roleIds: [31], expectedUpdatedAt: now.toISOString() },
        9,
        { actorUserId: 9, requestId: 'request-4' },
      ),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT' });
    expect(repository.replaceMembershipRoles).not.toHaveBeenCalled();
  });
});
