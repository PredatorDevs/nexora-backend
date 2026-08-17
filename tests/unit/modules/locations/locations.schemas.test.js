import { describe, expect, it } from 'vitest';
import { createLocationBody, updateLocationBody } from '../../../../src/modules/locations/locations.schemas.js';

describe('location schemas', () => {
  it('normalizes coordinates and ignores manual codes', () => {
    const value = createLocationBody.parse({
      code: 'MANUAL', warehouseId: 2, aisle: ' a ', rack: 'r-01', level: 'n1', position: 'p04',
      capacity: '2.5', capacityUnit: 'M3',
    });
    expect(value).toMatchObject({ aisle: 'A', rack: 'R-01', level: 'N1', position: 'P04', capacity: 2.5 });
    expect(value).not.toHaveProperty('code');
  });

  it('requires capacity and unit together on creation', () => {
    expect(createLocationBody.safeParse({
      warehouseId: 2, aisle: 'A', rack: '1', level: '1', position: '1', capacity: 10,
    }).success).toBe(false);
  });

  it('does not allow moving a location between warehouses', () => {
    const value = updateLocationBody.parse({
      warehouseId: 99,
      aisle: 'B',
      expectedUpdatedAt: '2026-08-18T00:00:00.000Z',
    });
    expect(value).not.toHaveProperty('warehouseId');
  });
});
