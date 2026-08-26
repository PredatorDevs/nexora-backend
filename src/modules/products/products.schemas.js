import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullable = (max) => z.string().trim().min(1).max(max).nullable();
const factor = z.coerce.number().positive().max(1e12);

export const productIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const productsListQuery = createListQuerySchema([
  'createdAt',
  'internalCode',
  'sku',
  'name',
  'isActive',
]).extend({
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
});

export const createProductBody = z.object({
  productCategoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().optional(),
  purchaseUnitId: z.number().int().positive(),
  saleUnitId: z.number().int().positive(),
  sku: nullable(100).optional(),
  originalCode: nullable(120).optional(),
  name: z.string().trim().min(1).max(191),
  size: nullable(120).optional(),
  dimensions: nullable(191).optional(),
  description: z.string().trim().min(1).max(5000).nullable().optional(),
  presentation: nullable(191).optional(),
  purchaseToSaleFactor: factor,
});

export const updateProductBody = createProductBody
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );

export const updateProductStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
