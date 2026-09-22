import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const purchaseQuotationIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const purchaseQuotationsListQuery = createListQuerySchema([
  'createdAt',
  'quotationDate',
  'validUntil',
  'code',
  'status',
  'total',
]).extend({
  status: z
    .enum([
      'DRAFT',
      'RECEIVED',
      'UNDER_REVIEW',
      'SELECTED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
    ])
    .optional(),
  supplierId: z.coerce.number().int().positive().optional(),
});
const nullable = (max) => z.string().trim().min(1).max(max).nullable();
const detail = z.object({
  productId: z.number().int().positive(),
  productUnitId: z.number().int().positive(),
  quantity: z.coerce.number().positive().max(1e14),
  unitPrice: z.coerce.number().min(0).max(1e14),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  deliveryDays: z.number().int().min(0).max(65535).nullable().optional(),
  availableQuantity: z.coerce.number().min(0).max(1e14).nullable().optional(),
  notes: nullable(5000).optional(),
});
const body = z
  .object({
    supplierId: z.number().int().positive(),
    supplierContactId: z.number().int().positive().nullable().optional(),
    supplierQuotationNumber: nullable(120).optional(),
    quotationDate: z.string().datetime(),
    validUntil: z.string().datetime(),
    currencyCode: z
      .string()
      .trim()
      .length(3)
      .transform((v) => v.toUpperCase()),
    exchangeRate: z.coerce.number().positive().max(1e12),
    exchangeRateDate: z.string().datetime().nullable().optional(),
    paymentTerms: nullable(500).optional(),
    deliveryDays: z.number().int().min(0).max(65535).nullable().optional(),
    notes: nullable(5000).optional(),
    details: z.array(detail).min(1).max(500),
  })
  .superRefine((value, context) => {
    if (new Date(value.validUntil) < new Date(value.quotationDate))
      context.addIssue({
        code: 'custom',
        path: ['validUntil'],
        message: 'Validity cannot be earlier than quotation date.',
      });
    const seen = new Set();
    value.details.forEach((item, index) => {
      const key = `${item.productId}:${item.productUnitId}`;
      if (seen.has(key))
        context.addIssue({
          code: 'custom',
          path: ['details', index, 'productId'],
          message: 'Product and unit cannot be repeated.',
        });
      seen.add(key);
      if (
        item.availableQuantity != null &&
        item.availableQuantity > item.quantity
      )
        context.addIssue({
          code: 'custom',
          path: ['details', index, 'availableQuantity'],
          message: 'Available quantity cannot exceed quoted quantity.',
        });
    });
  });
export const createPurchaseQuotationBody = body;
export const updatePurchaseQuotationBody = body.and(
  z.object({ expectedUpdatedAt: z.string().datetime() }),
);
export const purchaseQuotationTransitionBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
export const purchaseQuotationReasonTransitionBody =
  purchaseQuotationTransitionBody.extend({
    reason: z.string().trim().min(1).max(5000),
  });
export const replacePurchaseQuotationRequestLinksBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
  links: z
    .array(
      z.object({
        purchaseQuotationDetailId: z.number().int().positive(),
        purchaseRequestDetailId: z.number().int().positive(),
        quantity: z.coerce.number().positive().max(1e14),
      }),
    )
    .min(0)
    .max(1000),
});
