import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

export const purchaseRequestIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const purchaseRequestsListQuery = createListQuerySchema([
  'createdAt',
  'requestDate',
  'requiredDate',
  'code',
  'status',
]).extend({
  status: z
    .enum([
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'IN_QUOTATION',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  branchId: z.coerce.number().int().positive().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
});
const detail = z.object({
  productId: z.number().int().positive(),
  productUnitId: z.number().int().positive(),
  quantity: z.coerce.number().positive().max(1e14),
  description: z.string().trim().min(1).max(500).nullable().optional(),
  notes: z.string().trim().min(1).max(5000).nullable().optional(),
});
export const createPurchaseRequestBody = z
  .object({
    branchId: z.number().int().positive(),
    warehouseId: z.number().int().positive(),
    requiredDate: z.string().datetime(),
    justification: z.string().trim().min(1).max(5000),
    notes: z.string().trim().min(1).max(5000).nullable().optional(),
    details: z.array(detail).min(1).max(500),
  })
  .superRefine((value, context) => {
    const keys = new Set();
    value.details.forEach((item, index) => {
      const key = `${item.productId}:${item.productUnitId}`;
      if (keys.has(key))
        context.addIssue({
          code: 'custom',
          path: ['details', index, 'productId'],
          message: 'A product and unit combination cannot be repeated.',
        });
      keys.add(key);
    });
  });
export const updatePurchaseRequestBody = createPurchaseRequestBody.and(
  z.object({ expectedUpdatedAt: z.string().datetime() }),
);
export const purchaseRequestTransitionBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
export const purchaseRequestReasonTransitionBody =
  purchaseRequestTransitionBody.extend({
    reason: z.string().trim().min(1).max(5000),
  });
