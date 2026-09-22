import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const description = z.string().trim().min(1).max(500).nullable();
export const expenseTypeIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const expenseTypesListQuery = createListQuerySchema([
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
export const createExpenseTypeBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: description.optional(),
});
export const updateExpenseTypeBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: description.optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateExpenseTypeStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
