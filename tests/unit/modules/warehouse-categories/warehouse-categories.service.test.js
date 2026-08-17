import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWarehouseCategoriesService } from '../../../../src/modules/warehouse-categories/warehouse-categories.service.js';

describe('warehouse categories service', () => {
  let repository;
  let changes;
  let service;

  beforeEach(() => {
    repository = {
      findCompany: vi.fn().mockResolvedValue({ id: 8, status: 'ACTIVE' }),
      create: vi.fn().mockResolvedValue({
        id: 3,
        companyId: 8,
        code: 'COLD_STORAGE',
        name: 'Cámara fría',
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    };
    changes = { record: vi.fn() };
    service = createWarehouseCategoriesService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
      generateCode: vi.fn().mockResolvedValue('WCT-000001'),
    });
  });

  it('creates a category inside the active company', async () => {
    const data = { name: 'Cámara fría', description: null };
    await expect(service.create(8, data, { actorUserId: 1 })).resolves.toMatchObject({ id: 3 });
    expect(repository.create).toHaveBeenCalledWith(
      8,
      { ...data, code: 'WCT-000001' },
      { tx: true },
    );
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 8,
        entityType: 'warehouse_category',
        operation: 'CREATE',
      }),
      { tx: true },
    );
  });

  it('rejects creation when the company is inactive', async () => {
    repository.findCompany.mockResolvedValue({ id: 8, status: 'INACTIVE' });
    await expect(service.create(8, { name: 'Test' }, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
