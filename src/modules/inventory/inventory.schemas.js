import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

export const inventoryEligibleReceiptsQuery = z.object({
  search: z.string().trim().max(191).optional(),
});
export const inventoryReceiptParams = z.object({
  purchaseId: z.coerce.number().int().positive(),
});
export const postInventoryReceiptBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});

export const inventoryLotsQuery = createListQuerySchema([
  'receivedAt', 'code', 'createdAt', 'status',
]).extend({
  warehouseId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  status: z.enum(['PENDING', 'AVAILABLE', 'DEPLETED', 'CANCELLED']).optional(),
});
export const inventoryLotParams = z.object({ id: z.coerce.number().int().positive() });
export const assignInventoryLocationBody = z.object({
  locationId: z.number().int().positive(),
  quantity: z.coerce.number().positive().max(1e14),
});
export const printInventoryLabelsBody = z.object({
  quantity: z.coerce.number().int().positive().max(1000),
  reprintReason: z.string().trim().min(3).max(500).nullable().optional(),
});

const inventoryFilters = {
  branchId: z.coerce.number().int().positive().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  productId: z.coerce.number().int().positive().optional(),
  lotId: z.coerce.number().int().positive().optional(),
};
export const inventoryStockQuery = createListQuerySchema([
  'updatedAt', 'quantity', 'createdAt',
]).extend(inventoryFilters);
export const inventoryKardexQuery = createListQuerySchema([
  'movementDate', 'createdAt', 'movementType',
]).extend({
  ...inventoryFilters,
  movementType: z.enum([
    'PURCHASE_RECEIPT', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE_ISSUE',
    'CUSTOMER_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'REVERSAL',
  ]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export const inventoryCostsQuery = createListQuerySchema([
  'updatedAt', 'quantityOnHand', 'inventoryValue', 'averageUnitCost',
]).extend({ productId: z.coerce.number().int().positive().optional() });
