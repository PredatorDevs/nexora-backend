import { z } from 'zod';

export const inventoryEligibleReceiptsQuery = z.object({
  search: z.string().trim().max(191).optional(),
});
export const inventoryReceiptParams = z.object({
  purchaseId: z.coerce.number().int().positive(),
});
export const postInventoryReceiptBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
