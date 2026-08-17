import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableDescription = z.string().trim().min(1).max(500).nullable();

export const warehouseCategoryIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const warehouseCategoriesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'isActive',
]).extend({
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});

export const createWarehouseCategoryBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: nullableDescription.optional(),
});

export const updateWarehouseCategoryBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: nullableDescription.optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );

export const updateWarehouseCategoryStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
