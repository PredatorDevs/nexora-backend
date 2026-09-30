import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const description = z.string().trim().min(1).max(500).nullable();
const landedCostCategory = z.enum([
  'FREIGHT',
  'INSURANCE',
  'IMPORT_DUTY',
  'OTHER',
  'IMPORT_VAT',
]);
const allocationMethod = z.enum([
  'FOB_VALUE',
  'QUANTITY',
  'WEIGHT',
  'VOLUME',
  'CIF_VALUE',
  'EQUAL',
  'MANUAL',
]);
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
  landedCostCategory: landedCostCategory.optional(),
});
export const createExpenseTypeBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: description.optional(),
  landedCostCategory: landedCostCategory.default('OTHER'),
  defaultAllocationMethod: allocationMethod.default('FOB_VALUE'),
  isCapitalizable: z.boolean().default(false),
  isRecoverableTax: z.boolean().default(false),
  isCifComponent: z.boolean().default(false),
});
export const updateExpenseTypeBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: description.optional(),
    landedCostCategory: landedCostCategory.optional(),
    defaultAllocationMethod: allocationMethod.optional(),
    isCapitalizable: z.boolean().optional(),
    isRecoverableTax: z.boolean().optional(),
    isCifComponent: z.boolean().optional(),
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
