import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocationsService } from '../../../../src/modules/locations/locations.service.js';

const data = {
  warehouseId: 2,
  aisle: 'A',
  rack: 'R1',
  level: 'N1',
  position: 'P1',
  capacity: 10,
  capacityUnit: 'UNITS',
  notes: null,
};
describe('locations service', () => {
  let repository;
  let service;
  let changes;
  beforeEach(() => {
    repository = {
      findWarehouse: vi.fn().mockResolvedValue({
        id: 2,
        isActive: true,
        company: { status: 'ACTIVE' },
      }),
      create: vi.fn().mockResolvedValue({
        id: 3,
        companyId: 1,
        code: 'LOC-000001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      }),
      findCoordinateConflicts: vi.fn().mockResolvedValue([]),
      createBulk: vi.fn().mockImplementation((_companyId, values) =>
        values.map((value, index) => ({
          id: index + 1,
          companyId: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...value,
        })),
      ),
    };
    changes = {
      record: vi.fn(),
      recordMany: vi.fn().mockResolvedValue({ count: 4 }),
    };
    service = createLocationsService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
      generateCode: vi.fn().mockResolvedValue('LOC-000001'),
      generateCodes: vi
        .fn()
        .mockResolvedValue([
          'LOC-000001',
          'LOC-000002',
          'LOC-000003',
          'LOC-000004',
        ]),
    });
  });

  it('creates a location with a warehouse-scoped automatic code', async () => {
    await expect(
      service.create(1, data, { actorUserId: 8 }),
    ).resolves.toMatchObject({
      code: 'LOC-000001',
    });
    expect(repository.create).toHaveBeenCalledWith(
      1,
      { ...data, code: 'LOC-000001' },
      { tx: true },
    );
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'location',
        companyId: 1,
        operation: 'CREATE',
      }),
      { tx: true },
    );
  });

  it('rejects an inactive or cross-tenant warehouse', async () => {
    repository.findWarehouse.mockResolvedValue(null);
    await expect(service.create(1, data, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: ['warehouseId'] },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates every level and position atomically in bulk', async () => {
    await expect(
      service.createBulk(
        1,
        {
          warehouseId: 2,
          aisle: 'A',
          rack: 'R1',
          levelCount: 2,
          positionsPerLevel: 2,
          capacity: 10,
          capacityUnit: 'UNITS',
          notes: null,
        },
        {},
      ),
    ).resolves.toMatchObject({ createdCount: 4 });
    expect(repository.createBulk).toHaveBeenCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ level: '1', position: '1' }),
        expect.objectContaining({ level: '2', position: '2' }),
      ]),
      { tx: true },
    );
    expect(changes.recordMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'location',
          operation: 'CREATE',
        }),
      ]),
      { tx: true },
    );
  });

  it('rejects the complete batch when a coordinate already exists', async () => {
    repository.findCoordinateConflicts.mockResolvedValue([
      { aisle: 'A', rack: 'R1', level: '1', position: '1' },
    ]);
    await expect(
      service.createBulk(
        1,
        {
          warehouseId: 2,
          aisle: 'A',
          rack: 'R1',
          levelCount: 1,
          positionsPerLevel: 2,
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(repository.createBulk).not.toHaveBeenCalled();
  });
});
