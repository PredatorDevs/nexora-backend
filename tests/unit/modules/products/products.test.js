import { describe, expect, it, vi } from 'vitest';
import {
  createProductBody,
  productsListQuery,
} from '../../../../src/modules/products/products.schemas.js';
import { createProductsService } from '../../../../src/modules/products/products.service.js';

const validProduct = {
  productCategoryId: 10,
  purchaseUnitId: 20,
  saleUnitId: 21,
  name: ' Producto de prueba ',
  sku: ' SKU-001 ',
  purchaseToSaleFactor: 24,
};

describe('product schemas', () => {
  it('normalizes a valid product and its conversion factor', () => {
    expect(createProductBody.parse(validProduct)).toMatchObject({
      name: 'Producto de prueba',
      sku: 'SKU-001',
      purchaseToSaleFactor: 24,
    });
  });

  it('supports tenant catalog filters', () => {
    expect(
      productsListQuery.parse({
        categoryId: '3',
        brandId: '4',
        isActive: 'true',
      }),
    ).toMatchObject({ categoryId: 3, brandId: 4, isActive: true });
  });
});

describe('product service', () => {
  it('rejects a root category instead of a leaf subcategory', async () => {
    const repository = {
      findReferences: vi.fn().mockResolvedValue({
        company: { status: 'ACTIVE' },
        category: {
          isActive: true,
          parentCategoryId: null,
          parent: null,
          _count: { children: 1 },
        },
        brand: null,
        purchaseUnit: { isActive: true, type: 'PURCHASE' },
        saleUnit: { isActive: true, type: 'SALE' },
      }),
    };
    const service = createProductsService({
      repository,
      runInTransaction: (operation) => operation({}),
      generateCode: vi.fn(),
    });
    await expect(service.create(7, validProduct, {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a sale unit used as the purchase unit', async () => {
    const repository = {
      findReferences: vi.fn().mockResolvedValue({
        company: { status: 'ACTIVE' },
        category: {
          isActive: true,
          parentCategoryId: 1,
          parent: { isActive: true },
          _count: { children: 0 },
        },
        brand: null,
        purchaseUnit: { isActive: true, type: 'SALE' },
        saleUnit: { isActive: true, type: 'SALE' },
      }),
    };
    const service = createProductsService({
      repository,
      runInTransaction: (operation) => operation({}),
      generateCode: vi.fn(),
    });
    await expect(service.create(7, validProduct, {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
