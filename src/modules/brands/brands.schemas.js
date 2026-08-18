import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableText = (max) => z.string().trim().min(1).max(max).nullable();
export const brandIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const brandsListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'isActive',
]).extend({
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export const createBrandBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: nullableText(500).optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
  logoStorageKey: nullableText(500).optional(),
});
export const updateBrandBody = createBrandBody
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateBrandStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
