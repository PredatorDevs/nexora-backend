import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
const type = z.enum(['PURCHASE', 'SALE']);
const nullableDescription = z.string().trim().min(1).max(500).nullable();
export const productUnitIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const productUnitsListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'type',
  'isActive',
]).extend({
  type: type.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export const createProductUnitBody = z.object({
  measurementUnitId: z.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  type,
  description: nullableDescription.optional(),
});
export const updateProductUnitBody = createProductUnitBody
  .partial()
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .refine(
    (v) => Object.keys(v).some((k) => k !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateProductUnitStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
