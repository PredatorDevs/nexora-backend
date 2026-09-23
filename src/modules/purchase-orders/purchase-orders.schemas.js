import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const purchaseOrderIdParams = z.object({ id: z.coerce.number().int().positive() });
export const purchaseOrdersListQuery = createListQuerySchema(['createdAt','orderDate','expectedDate','code','status','total']).extend({
  status: z.enum(['DRAFT','PENDING_APPROVAL','APPROVED','SENT','PARTIALLY_RECEIVED','RECEIVED','CANCELLED','CLOSED']).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
});
export const generatePurchaseOrdersBody = z.object({
  purchaseRequestId: z.number().int().positive(),
  orderDate: z.string().datetime(),
  expectedDate: z.string().datetime(),
  notes: z.string().trim().min(1).max(5000).nullable().optional(),
});
export const purchaseOrderTransitionBody = z.object({ expectedUpdatedAt: z.string().datetime() });
export const purchaseOrderReasonTransitionBody = purchaseOrderTransitionBody.extend({ reason: z.string().trim().min(1).max(5000) });
