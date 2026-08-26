import { describe, expect, it } from 'vitest';
import { createWarehouseBody, warehousesListQuery } from '../../../../src/modules/warehouses/warehouses.schemas.js';

describe('warehouse schemas', () => {
  it('strips client-provided codes from creation', () => {
    const parsed = createWarehouseBody.parse({
      code: 'MANUAL',
      branchId: 2,
      warehouseCategoryId: 3,
      name: 'Principal',
    });
    expect(parsed).not.toHaveProperty('code');
  });

  it('normalizes list filters', () => {
    expect(warehousesListQuery.parse({ branchId: '2', isActive: 'false' })).toMatchObject({
      branchId: 2,
      isActive: false,
    });
  });

  it('accepts supported location separators', () => {
    const parsed = createWarehouseBody.parse({
      branchId: 2,
      warehouseCategoryId: 3,
      name: 'Principal',
      locationSeparator: '-',
    });
    expect(parsed.locationSeparator).toBe('-');
  });

  it('rejects unsupported location separators', () => {
    expect(() => createWarehouseBody.parse({
      branchId: 2,
      warehouseCategoryId: 3,
      name: 'Principal',
      locationSeparator: ':',
    })).toThrow();
  });
});
