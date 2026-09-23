import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const purchaseOrderIdParams = z.object({ id: z.coerce.number().int().positive() });
export const purchaseOrderExpenseParams = purchaseOrderIdParams.extend({ expenseId: z.coerce.number().int().positive() });
export const purchaseOrderDocumentParams = purchaseOrderExpenseParams.extend({ documentId: z.coerce.number().int().positive() });
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
const expenseFields = {
  expenseTypeId: z.number().int().positive(),
  description: z.string().trim().min(1).max(500).nullable().optional(),
  amount: z.coerce.number().positive().max(999_999_999_999),
  isCostable: z.boolean().default(true),
};
export const createPurchaseOrderExpenseBody = z.object({ ...expenseFields, expectedOrderUpdatedAt: z.string().datetime() });
export const updatePurchaseOrderExpenseBody = z.object({ ...expenseFields, expectedOrderUpdatedAt: z.string().datetime(), expectedUpdatedAt: z.string().datetime() });
export const deletePurchaseOrderExpenseBody = z.object({ expectedOrderUpdatedAt: z.string().datetime(), expectedUpdatedAt: z.string().datetime() });
export const preparePurchaseOrderDocumentBody = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(['application/pdf','image/jpeg','image/png','image/webp']),
  sizeBytes: z.number().int().positive(),
});
export const registerPurchaseOrderDocumentBody = z.object({
  storageKey: z.string().trim().min(1).max(500),
  originalFileName: z.string().trim().min(1).max(255),
});
