import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBranchesService } from '../../../../src/modules/branches/branches.service.js';

const data = {
  code: 'SS01',
  name: 'San Salvador',
  isHeadquarters: true,
  countryId: 1,
  departmentId: 2,
  municipalityId: 3,
  districtId: 4,
  addressLine: 'Centro',
  phone: null,
  email: null,
};
describe('branches service', () => {
  let repository;
  let service;
  let changes;
  beforeEach(() => {
    repository = {
      findCompany: vi.fn().mockResolvedValue({ id: 8, status: 'ACTIVE' }),
      findAddress: vi
        .fn()
        .mockResolvedValue({
          country: { abbreviation: 'SV' },
          district: { id: 4 },
        }),
      clearHeadquarters: vi.fn(),
      create: vi
        .fn()
        .mockResolvedValue({
          id: 9,
          companyId: 8,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        }),
    };
    changes = { record: vi.fn() };
    service = createBranchesService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
    });
  });
  it('creates a headquarters atomically inside its company', async () => {
    const result = await service.create(8, data, { actorUserId: 1 });
    expect(result.id).toBe(9);
    expect(repository.clearHeadquarters).toHaveBeenCalledWith(8, null, {
      tx: true,
    });
    expect(repository.create).toHaveBeenCalledWith(8, data, { tx: true });
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 8,
        entityType: 'branch',
        operation: 'CREATE',
      }),
      { tx: true },
    );
  });
  it('rejects a broken address hierarchy', async () => {
    repository.findAddress.mockResolvedValue({
      country: { abbreviation: 'SV' },
      district: null,
    });
    await expect(service.create(8, data, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });
  it('creates a foreign branch without Salvador subdivision ids', async () => {
    repository.findAddress.mockResolvedValue({
      country: { abbreviation: 'GT' },
      district: null,
    });
    const foreign = {
      ...data,
      countryId: 2,
      departmentId: null,
      municipalityId: null,
      districtId: null,
      foreignAdministrativeArea: 'Guatemala',
      foreignLocality: 'Ciudad de Guatemala',
    };
    repository.create.mockResolvedValue({ id: 10, companyId: 8, ...foreign });

    await expect(service.create(8, foreign, {})).resolves.toMatchObject({
      id: 10,
      countryId: 2,
    });
  });
});
