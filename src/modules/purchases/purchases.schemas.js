import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

export const purchaseIdParams = z.object({ id: z.coerce.number().int().positive() });
export const purchaseOrderAvailabilityParams = z.object({ orderId: z.coerce.number().int().positive() });
export const purchasesListQuery = createListQuerySchema(['createdAt','purchaseDate','code','status','total']).extend({
  status: z.enum(['DRAFT','RECEIVED','VERIFIED','CANCELLED','CLOSED']).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  purchaseOrderId: z.coerce.number().int().positive().optional(),
});
const nullableText=(max)=>z.string().trim().min(1).max(max).nullable().optional();
const detail=z.object({purchaseOrderDetailId:z.number().int().positive(),quantityReceived:z.coerce.number().positive().max(1e14),notes:nullableText(5000)});
const draft=z.object({
  purchaseOrderId:z.number().int().positive(),
  expectedOrderUpdatedAt:z.string().datetime(),
  purchaseDate:z.string().datetime(),
  supplierInvoiceNumber:nullableText(100),
  supplierInvoiceDate:z.string().date().nullable().optional(),
  notes:nullableText(5000),
  details:z.array(detail).min(1).max(500),
}).superRefine((value,context)=>{const ids=new Set();value.details.forEach((item,index)=>{if(ids.has(item.purchaseOrderDetailId))context.addIssue({code:'custom',path:['details',index,'purchaseOrderDetailId'],message:'An order line cannot be repeated.'});ids.add(item.purchaseOrderDetailId);});});
export const createPurchaseBody=draft;
export const updatePurchaseBody=draft.and(z.object({expectedUpdatedAt:z.string().datetime()}));
export const receivePurchaseBody=z.object({expectedUpdatedAt:z.string().datetime(),expectedOrderUpdatedAt:z.string().datetime()});
export const purchaseTransitionBody=z.object({expectedUpdatedAt:z.string().datetime()});
export const cancelPurchaseBody=purchaseTransitionBody.extend({expectedOrderUpdatedAt:z.string().datetime(),reason:z.string().trim().min(1).max(5000)});
