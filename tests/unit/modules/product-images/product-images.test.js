import { describe, expect, it, vi } from 'vitest';
import {
  createProductImageBody,
  reorderProductImagesBody,
} from '../../../../src/modules/product-images/product-images.schemas.js';
import { createProductImagesService } from '../../../../src/modules/product-images/product-images.service.js';

describe('product image schemas', () => {
  it('normalizes image metadata', () => {
    expect(
      createProductImageBody.parse({
        storageKey: ' companies/7/products/a.webp ',
        altText: ' Frente ',
      }),
    ).toEqual({ storageKey: 'companies/7/products/a.webp', altText: 'Frente' });
  });

  it('rejects duplicated identifiers when reordering', () => {
    expect(() =>
      reorderProductImagesBody.parse({ imageIds: [1, 1] }),
    ).toThrow();
  });
});

describe('product image service', () => {
  it('makes the first product image primary automatically', async () => {
    const repository = {
      findProduct: vi.fn().mockResolvedValue({ id: 9 }),
      stats: vi.fn().mockResolvedValue({ count: 0, maxSortOrder: -1 }),
      clearPrimary: vi.fn(),
      create: vi
        .fn()
        .mockImplementation((_companyId, productId, data) => ({
          id: 1,
          productId,
          ...data,
        })),
    };
    const storage = { verifyImageUpload: vi.fn().mockResolvedValue({}) };
    const service = createProductImagesService({
      repository,
      storage,
      runInTransaction: (operation) => operation({}),
    });
    const created = await service.create(
      7,
      9,
      { storageKey: 'companies/7/products/a.webp' },
      {},
    );
    expect(created).toMatchObject({ isPrimary: true, sortOrder: 0 });
    expect(storage.verifyImageUpload).toHaveBeenCalled();
  });

  it('requires the complete image set when reordering', async () => {
    const repository = {
      findProduct: vi.fn().mockResolvedValue({ id: 9 }),
      list: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    };
    const service = createProductImagesService({
      repository,
      storage: {},
      runInTransaction: (operation) => operation({}),
    });
    await expect(service.reorder(7, 9, [1], {})).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
