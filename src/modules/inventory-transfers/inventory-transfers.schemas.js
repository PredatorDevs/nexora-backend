import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableText = z.string().trim().min(1).max(5000).nullable().optional();
export const inventoryTransfersQuery = createListQuerySchema([
  'createdAt', 'code', 'status', 'dispatchedAt', 'receivedAt',
]).extend({
  status: z.enum(['PREPARATION', 'IN_TRANSIT', 'RECEIVED', 'INCIDENT', 'CANCELLED']).optional(),
  sourceWarehouseId: z.coerce.number().int().positive().optional(),
  destinationWarehouseId: z.coerce.number().int().positive().optional(),
});
export const inventoryTransferParams = z.object({ id: z.coerce.number().int().positive() });
export const createInventoryTransferBody = z.object({
  sourceWarehouseId: z.number().int().positive(),
  destinationWarehouseId: z.number().int().positive(),
  notes: nullableText,
  details: z.array(z.object({
    inventoryLotId: z.number().int().positive(),
    sourceLocationId: z.number().int().positive(),
    destinationLocationId: z.number().int().positive(),
    quantity: z.coerce.number().positive().max(1e14),
    notes: nullableText,
  })).min(1).max(500),
}).superRefine((value, context) => {
  if (value.sourceWarehouseId === value.destinationWarehouseId)
    context.addIssue({ code: 'custom', path: ['destinationWarehouseId'], message: 'El almacén destino debe ser diferente al origen.' });
  const keys = new Set();
  value.details.forEach((item, index) => {
    const key = `${item.inventoryLotId}:${item.sourceLocationId}:${item.destinationLocationId}`;
    if (keys.has(key)) context.addIssue({ code: 'custom', path: ['details', index], message: 'La misma combinación de lote y ubicaciones no puede repetirse.' });
    keys.add(key);
  });
});
export const inventoryTransferTransitionBody = z.object({ expectedUpdatedAt: z.string().datetime() });
export const inventoryTransferReasonBody = inventoryTransferTransitionBody.extend({
  reason: z.string().trim().min(3).max(5000),
});

export const createInventoryRelocationBody = z.object({
  warehouseId: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
  notes: nullableText,
  details: z.array(z.object({
    inventoryLotId: z.number().int().positive(),
    sourceLocationId: z.number().int().positive(),
    destinationLocationId: z.number().int().positive(),
    quantity: z.coerce.number().positive().max(1e14),
    notes: nullableText,
  }).superRefine((item, context) => {
    if (item.sourceLocationId === item.destinationLocationId)
      context.addIssue({ code: 'custom', path: ['destinationLocationId'], message: 'La ubicación destino debe ser diferente al origen.' });
  })).min(1).max(500),
}).superRefine((value, context) => {
  const keys = new Set();
  value.details.forEach((item, index) => {
    const key = `${item.inventoryLotId}:${item.sourceLocationId}:${item.destinationLocationId}`;
    if (keys.has(key)) context.addIssue({ code: 'custom', path: ['details', index], message: 'La misma combinación de lote y ubicaciones no puede repetirse.' });
    keys.add(key);
  });
});
