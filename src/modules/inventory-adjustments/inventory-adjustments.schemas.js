import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const text = z.string().trim().min(3).max(5000);
export const inventoryAdjustmentsQuery = createListQuerySchema([
  'createdAt', 'code', 'status', 'approvedAt',
]).extend({
  status: z.enum(['DRAFT', 'APPROVED', 'CANCELLED']).optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
});
export const inventoryAdjustmentParams = z.object({ id: z.coerce.number().int().positive() });
export const inventoryMovementParams = z.object({ id: z.coerce.bigint().positive() });
export const createInventoryAdjustmentBody = z.object({
  warehouseId: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
  notes: z.string().trim().min(1).max(5000).nullable().optional(),
  details: z.array(z.object({
    inventoryLotId: z.number().int().positive(),
    locationId: z.number().int().positive(),
    direction: z.enum(['IN', 'OUT']),
    quantity: z.coerce.number().positive().max(1e14),
    notes: z.string().trim().min(1).max(5000).nullable().optional(),
  })).min(1).max(500),
}).superRefine((value, context) => {
  const keys = new Set();
  value.details.forEach((item, index) => {
    const key = `${item.inventoryLotId}:${item.locationId}:${item.direction}`;
    if (keys.has(key)) context.addIssue({
      code: 'custom', path: ['details', index],
      message: 'La misma combinación de lote, ubicación y dirección no puede repetirse.',
    });
    keys.add(key);
  });
});
export const inventoryAdjustmentTransitionBody = z.object({ expectedUpdatedAt: z.string().datetime() });
export const inventoryAdjustmentCancelBody = inventoryAdjustmentTransitionBody.extend({ reason: text });
export const reverseInventoryMovementBody = z.object({ reason: text });

