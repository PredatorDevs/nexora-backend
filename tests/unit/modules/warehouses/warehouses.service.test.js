import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWarehousesService } from '../../../../src/modules/warehouses/warehouses.service.js';

const data = {
  branchId: 2,
  warehouseCategoryId: 3,
  name: 'Almacén principal',
  description: null,
};

describe('warehouses service', () => {
  let repository;
  let changes;
  let service;
  beforeEach(() => {
    repository = {
      findReferences: vi.fn().mockResolvedValue({
        company: { id: 1, status: 'ACTIVE' },
        branch: { id: 2, status: 'ACTIVE' },
        category: { id: 3, isActive: true },
      }),
      create: vi.fn().mockResolvedValue({
        id: 4,
        companyId: 1,
        code: 'WH-000001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      }),
    };
    changes = { record: vi.fn() };
    service = createWarehousesService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
      generateCode: vi.fn().mockResolvedValue('WH-000001'),
    });
  });

  it('creates a warehouse with an automatic code inside its tenant', async () => {
    await expect(service.create(1, data, { actorUserId: 9 })).resolves.toMatchObject({
      id: 4,
      code: 'WH-000001',
    });
    expect(repository.findReferences).toHaveBeenCalledWith(1, 2, 3, { tx: true });
    expect(repository.create).toHaveBeenCalledWith(
      1,
      { ...data, code: 'WH-000001' },
      { tx: true },
    );
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 1, entityType: 'warehouse', operation: 'CREATE' }),
      { tx: true },
    );
  });

  it('rejects a branch that is inactive or outside the tenant', async () => {
    repository.findReferences.mockResolvedValue({
      company: { id: 1, status: 'ACTIVE' },
      branch: null,
      category: { id: 3, isActive: true },
    });
    await expect(service.create(1, data, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: ['branchId'] },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive category', async () => {
    repository.findReferences.mockResolvedValue({
      company: { id: 1, status: 'ACTIVE' },
      branch: { id: 2, status: 'ACTIVE' },
      category: { id: 3, isActive: false },
    });
    await expect(service.create(1, data, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: ['warehouseCategoryId'] },
    });
  });
});
