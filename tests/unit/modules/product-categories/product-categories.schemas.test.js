import { describe, expect, it } from 'vitest';
import {
  createProductCategoryBody,
  productCategoriesListQuery,
} from '../../../../src/modules/product-categories/product-categories.schemas.js';
describe('product category schemas', () => {
  it('accepts roots and subcategories without internal integrity fields', () => {
    expect(
      createProductCategoryBody.parse({
        name: ' Accesorios ',
        parentCategoryId: 4,
      }),
    ).toEqual({ name: 'Accesorios', parentCategoryId: 4 });
  });
  it('prevents contradictory hierarchy filters', () => {
    expect(() =>
      productCategoriesListQuery.parse({ parentId: '1', rootOnly: 'true' }),
    ).toThrow();
  });
});
