import { describe, expect, it, vi } from 'vitest';
import {
  createProductUnitBody,
  productUnitsListQuery,
} from '../../../../src/modules/product-units/product-units.schemas.js';
import { createProductUnitsService } from '../../../../src/modules/product-units/product-units.service.js';

describe('product unit schemas', () => {
  it('normalizes a valid commercial unit', () => {
    expect(
      createProductUnitBody.parse({
        measurementUnitId: 59,
        name: ' Caja de 24 ',
        type: 'PURCHASE',
      }),
    ).toEqual({ measurementUnitId: 59, name: 'Caja de 24', type: 'PURCHASE' });
  });
  it('supports usage and status filters', () => {
    expect(
      productUnitsListQuery.parse({ type: 'SALE', isActive: 'true' }),
    ).toMatchObject({ type: 'SALE', isActive: true });
  });
});

describe('product unit service', () => {
  it('rejects an inactive global measurement unit', async () => {
    const repository = {
      findReferences: vi
        .fn()
        .mockResolvedValue({
          company: { status: 'ACTIVE' },
          measurementUnit: { isActive: false },
        }),
    };
    const service = createProductUnitsService({
      repository,
      runInTransaction: (operation) => operation({}),
      generateCode: vi.fn(),
    });
    await expect(
      service.create(
        7,
        { measurementUnitId: 2, name: 'Caja', type: 'PURCHASE' },
        {},
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
