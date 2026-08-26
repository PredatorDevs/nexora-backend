import { describe, expect, it } from 'vitest';
import {
  createLocationBody,
  createLocationsBulkBody,
  updateLocationBody,
} from '../../../../src/modules/locations/locations.schemas.js';

describe('location schemas', () => {
  it('normalizes coordinates and ignores manual codes', () => {
    const value = createLocationBody.parse({
      code: 'MANUAL',
      warehouseId: 2,
      aisle: ' a ',
      rack: 'r-01',
      level: 'n1',
      position: 'p04',
      capacity: '2.5',
      capacityUnit: 'M3',
    });
    expect(value).toMatchObject({
      aisle: 'A',
      rack: 'R-01',
      level: 'N1',
      position: 'P04',
      capacity: 2.5,
    });
    expect(value).not.toHaveProperty('code');
  });

  it('requires capacity and unit together on creation', () => {
    expect(
      createLocationBody.safeParse({
        warehouseId: 2,
        aisle: 'A',
        rack: '1',
        level: '1',
        position: '1',
        capacity: 10,
      }).success,
    ).toBe(false);
  });

  it('does not allow moving a location between warehouses', () => {
    const value = updateLocationBody.parse({
      warehouseId: 99,
      aisle: 'B',
      expectedUpdatedAt: '2026-08-18T00:00:00.000Z',
    });
    expect(value).not.toHaveProperty('warehouseId');
  });

  it('accepts a bounded bulk location grid', () => {
    expect(
      createLocationsBulkBody.parse({
        warehouseId: 2,
        aisle: ' a ',
        rack: ' e-01 ',
        levelCount: 4,
        positionsPerLevel: 6,
      }),
    ).toMatchObject({
      aisle: 'A',
      rack: 'E-01',
      levelCount: 4,
      positionsPerLevel: 6,
    });
  });

  it('limits a bulk operation to 200 locations', () => {
    expect(
      createLocationsBulkBody.safeParse({
        warehouseId: 2,
        aisle: 'A',
        rack: '1',
        levelCount: 10,
        positionsPerLevel: 21,
      }).success,
    ).toBe(false);
  });
});
