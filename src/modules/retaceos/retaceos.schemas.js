import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableText = (max) =>
  z.string().trim().min(1).max(max).nullable().optional();
const nullableDate = z.string().date().nullable().optional();
const allocationMethod = z.enum([
  'FOB_VALUE', 'QUANTITY', 'WEIGHT', 'VOLUME', 'CIF_VALUE', 'EQUAL', 'MANUAL',
]);
const costCategory = z.enum([
  'FREIGHT', 'INSURANCE', 'IMPORT_DUTY', 'OTHER', 'IMPORT_VAT',
]);

export const retaceoIdParams = z.object({ id: z.coerce.number().int().positive() });
export const retaceoCostParams = retaceoIdParams.extend({
  costId: z.coerce.number().int().positive(),
});
export const retaceosListQuery = createListQuerySchema([
  'createdAt', 'retaceoDate', 'code', 'status', 'totalLandedCost',
]).extend({
  status: z.enum(['DRAFT', 'CALCULATED', 'VERIFIED', 'CLOSED', 'CANCELLED']).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  purchaseId: z.coerce.number().int().positive().optional(),
});
export const eligiblePurchasesQuery = createListQuerySchema([
  'purchaseDate', 'code', 'createdAt',
]);

export const createRetaceoBody = z.object({
  purchaseId: z.number().int().positive(),
  originCountryId: z.number().int().positive(),
  retaceoDate: z.string().datetime(),
  importInvoiceNumber: nullableText(120),
  importInvoiceDate: nullableDate,
  importPolicyNumber: nullableText(120),
  importPolicyDate: nullableDate,
  notes: nullableText(5000),
  includeOrderExpenses: z.boolean().default(true),
});

const detailMeasure = z.object({
  retaceoDetailId: z.number().int().positive(),
  weight: z.coerce.number().nonnegative().max(1e14).nullable().optional(),
  volume: z.coerce.number().nonnegative().max(1e14).nullable().optional(),
});
export const updateRetaceoBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
  originCountryId: z.number().int().positive(),
  retaceoDate: z.string().datetime(),
  importInvoiceNumber: nullableText(120),
  importInvoiceDate: nullableDate,
  importPolicyNumber: nullableText(120),
  importPolicyDate: nullableDate,
  notes: nullableText(5000),
  details: z.array(detailMeasure).max(500).default([]),
});

const costFields = {
  expenseTypeId: z.number().int().positive(),
  description: nullableText(500),
  documentNumber: nullableText(120),
  documentDate: nullableDate,
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  originalAmount: z.coerce.number().positive().max(1e14),
  exchangeRate: z.coerce.number().positive().max(1e8).default(1),
  exchangeRateDate: nullableDate,
  category: costCategory.optional(),
  isCapitalizable: z.boolean().optional(),
  isRecoverableTax: z.boolean().optional(),
  isCifComponent: z.boolean().optional(),
  allocationMethod: allocationMethod.optional(),
};
const validateCost = (schema) => schema.superRefine((value, context) => {
  if (value.isRecoverableTax && value.isCapitalizable)
    context.addIssue({
      code: 'custom', path: ['isCapitalizable'],
      message: 'Un impuesto recuperable no puede formar parte del costo.',
    });
});

export const createRetaceoCostBody = validateCost(z.object({ ...costFields,
  expectedRetaceoUpdatedAt: z.string().datetime(),
}));
export const updateRetaceoCostBody = validateCost(z.object({ ...costFields,
  expectedRetaceoUpdatedAt: z.string().datetime(),
}));
export const deleteRetaceoCostBody = z.object({
  expectedRetaceoUpdatedAt: z.string().datetime(),
});
const manualAllocation = z.object({
  retaceoDetailId: z.number().int().positive(),
  amount: z.coerce.number().nonnegative().max(1e14),
});
export const calculateRetaceoBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
  manualAllocations: z.array(z.object({
    retaceoCostId: z.number().int().positive(),
    allocations: z.array(manualAllocation).min(1).max(500),
  })).max(500).default([]),
});
export const retaceoTransitionBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
export const cancelRetaceoBody = retaceoTransitionBody.extend({
  reason: z.string().trim().min(1).max(5000),
});
