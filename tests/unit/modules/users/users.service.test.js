import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createUsersService } from '../../../../src/modules/users/users.service.js';

describe('users service', () => {
  let repository;
  let rbacService;
  let passwordHasher;
  let service;

  beforeEach(() => {
    repository = {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      changeStatus: vi.fn(),
      hasRoleCode: vi.fn(),
      countActiveUsersWithRoleCode: vi.fn(),
      resetPassword: vi.fn(),
    };
    rbacService = { replaceUserRoles: vi.fn() };
    passwordHasher = vi.fn();
    service = createUsersService({ repository, rbacService, passwordHasher });
  });

  it('hashes passwords before creating users', async () => {
    passwordHasher.mockResolvedValue('password-hash');
    repository.create.mockResolvedValue({ id: 10 });

    await expect(
      service.create({
        email: 'user@example.test',
        displayName: 'Test User',
        password: 'Secret123!',
      }),
    ).resolves.toEqual({ id: 10 });
    expect(repository.create).toHaveBeenCalledWith({
      email: 'user@example.test',
      displayName: 'Test User',
      passwordHash: 'password-hash',
    });
  });

  it('prevents users from changing their own status', async () => {
    await expect(
      service.changeStatus({
        userId: 5,
        status: 'INACTIVE',
        actorUserId: 5,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT', statusCode: 409 });
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('rejects a stale user update', async () => {
    repository.findById.mockResolvedValue({
      id: 5,
      updatedAt: new Date('2026-07-20T12:01:00.000Z'),
    });
    repository.update.mockResolvedValue(null);

    await expect(
      service.update(5, {
        displayName: 'Stale edit',
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      code: 'RESOURCE_CONFLICT',
      statusCode: 409,
      details: { reason: 'STALE_WRITE' },
    });
  });

  it('preserves the last active super administrator', async () => {
    repository.findById.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    repository.hasRoleCode.mockResolvedValue(true);
    repository.countActiveUsersWithRoleCode.mockResolvedValue(1);

    await expect(
      service.changeStatus({
        userId: 5,
        status: 'INACTIVE',
        actorUserId: 9,
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT', statusCode: 409 });
    expect(repository.changeStatus).not.toHaveBeenCalled();
  });

  it('delegates status changes when the safety checks pass', async () => {
    repository.findById.mockResolvedValue({ id: 5, status: 'ACTIVE' });
    repository.hasRoleCode.mockResolvedValue(false);
    repository.changeStatus.mockResolvedValue({ id: 5, status: 'INACTIVE' });

    await expect(
      service.changeStatus({
        userId: 5,
        status: 'INACTIVE',
        actorUserId: 9,
      }),
    ).resolves.toEqual({ id: 5, status: 'INACTIVE' });
  });

  it('replaces roles through RBAC and returns the refreshed user', async () => {
    repository.findById.mockResolvedValue({ id: 5, roles: [{ id: 2 }] });

    await expect(
      service.replaceRoles({ userId: 5, roleIds: [2], actorUserId: 9 }),
    ).resolves.toEqual({ id: 5, roles: [{ id: 2 }] });
    expect(rbacService.replaceUserRoles).toHaveBeenCalledWith({
      userId: 5,
      roleIds: [2],
      actorUserId: 9,
    });
  });

  it('hashes an administrative password reset', async () => {
    repository.findById.mockResolvedValue({ id: 5 });
    passwordHasher.mockResolvedValue('replacement-hash');
    repository.resetPassword.mockResolvedValue({
      id: 5,
      mustChangePassword: true,
    });

    await expect(
      service.resetPassword(5, {
        password: 'replacement-password',
        mustChangePassword: true,
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).resolves.toMatchObject({ id: 5, mustChangePassword: true });
    expect(repository.resetPassword).toHaveBeenCalledWith(5, {
      passwordHash: 'replacement-hash',
      mustChangePassword: true,
      expectedUpdatedAt: new Date('2026-07-20T12:00:00.000Z'),
    });
  });
});
