import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableDescription = z.string().trim().min(1).max(500).nullable();
const locationSeparator = z.enum(['/', '-', '.', '|', '·']);
export const warehouseIdParams = z.object({ id: z.coerce.number().int().positive() });
export const warehousesListQuery = createListQuerySchema([
  'createdAt', 'code', 'name', 'isActive',
]).extend({
  branchId: z.coerce.number().int().positive().optional(),
  warehouseCategoryId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const createWarehouseBody = z.object({
  branchId: z.number().int().positive(),
  warehouseCategoryId: z.number().int().positive(),
  name: z.string().trim().min(1).max(191),
  description: nullableDescription.optional(),
  locationSeparator: locationSeparator.optional(),
});
export const updateWarehouseBody = z.object({
  branchId: z.number().int().positive().optional(),
  warehouseCategoryId: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(191).optional(),
  description: nullableDescription.optional(),
  locationSeparator: locationSeparator.optional(),
  expectedUpdatedAt: z.string().datetime(),
}).refine(
  (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
  'At least one field is required.',
);
export const updateWarehouseStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
