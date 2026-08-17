import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocationsService } from '../../../../src/modules/locations/locations.service.js';

const data = {
  warehouseId: 2, aisle: 'A', rack: 'R1', level: 'N1', position: 'P1',
  capacity: 10, capacityUnit: 'UNITS', notes: null,
};
describe('locations service', () => {
  let repository;
  let service;
  let changes;
  beforeEach(() => {
    repository = {
      findWarehouse: vi.fn().mockResolvedValue({
        id: 2, isActive: true, company: { status: 'ACTIVE' },
      }),
      create: vi.fn().mockResolvedValue({
        id: 3, companyId: 1, code: 'LOC-000001', isActive: true,
        createdAt: new Date(), updatedAt: new Date(), ...data,
      }),
    };
    changes = { record: vi.fn() };
    service = createLocationsService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
      generateCode: vi.fn().mockResolvedValue('LOC-000001'),
    });
  });

  it('creates a location with a warehouse-scoped automatic code', async () => {
    await expect(service.create(1, data, { actorUserId: 8 })).resolves.toMatchObject({
      code: 'LOC-000001',
    });
    expect(repository.create).toHaveBeenCalledWith(
      1,
      { ...data, code: 'LOC-000001' },
      { tx: true },
    );
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'location', companyId: 1, operation: 'CREATE' }),
      { tx: true },
    );
  });

  it('rejects an inactive or cross-tenant warehouse', async () => {
    repository.findWarehouse.mockResolvedValue(null);
    await expect(service.create(1, data, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR', details: { fields: ['warehouseId'] },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
