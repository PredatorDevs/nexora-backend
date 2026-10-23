import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createInventoryAdjustmentsController } from './inventory-adjustments.controller.js';
import { inventoryAdjustmentsQuery, inventoryAdjustmentParams, inventoryMovementParams, createInventoryAdjustmentBody, inventoryAdjustmentTransitionBody, inventoryAdjustmentCancelBody, reverseInventoryMovementBody } from './inventory-adjustments.schemas.js';

export function createInventoryAdjustmentsRouter(service, auditService) {
  const router = Router();
  const controller = createInventoryAdjustmentsController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('inventory.read'), validate({ query: inventoryAdjustmentsQuery }), controller.list);
  router.get('/:id', authorizeCompany('inventory.read'), validate({ params: inventoryAdjustmentParams }), controller.get);
  router.post('/', authorizeCompany('inventory.adjustments_create'), validate({ body: createInventoryAdjustmentBody }), controller.create);
  router.post('/:id/approve', authorizeCompany('inventory.adjustments_approve'), validate({ params: inventoryAdjustmentParams, body: inventoryAdjustmentTransitionBody }), controller.approve);
  router.post('/:id/cancel', authorizeCompany('inventory.adjustments_create'), validate({ params: inventoryAdjustmentParams, body: inventoryAdjustmentCancelBody }), controller.cancel);
  router.post('/movements/:id/reverse', authorizeCompany('inventory.movements_reverse'), validate({ params: inventoryMovementParams, body: reverseInventoryMovementBody }), controller.reverseMovement);
  return router;
}
