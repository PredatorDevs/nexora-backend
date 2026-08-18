import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const productCategoryIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const productCategoriesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'isActive',
])
  .extend({
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    parentId: z.coerce.number().int().positive().optional(),
    rootOnly: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .refine(
    (v) => !(v.parentId && v.rootOnly),
    'parentId and rootOnly cannot be combined.',
  );
const fields = {
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).nullable().optional(),
  parentCategoryId: z.number().int().positive().nullable().optional(),
};
export const createProductCategoryBody = z.object(fields);
export const updateProductCategoryBody = z
  .object(fields)
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .refine(
    (v) => Object.keys(v).some((k) => k !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateProductCategoryStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
