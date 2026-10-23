import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createInventoryTransfersController } from './inventory-transfers.controller.js';
import {
  createInventoryTransferBody, inventoryTransferParams, inventoryTransferReasonBody,
  inventoryTransfersQuery, inventoryTransferTransitionBody, createInventoryRelocationBody,
} from './inventory-transfers.schemas.js';

export function createInventoryTransfersRouter(service, auditService) {
  const router = Router();
  const controller = createInventoryTransfersController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('inventory.read'), validate({ query: inventoryTransfersQuery }), controller.list);
  router.get('/:id', authorizeCompany('inventory.read'), validate({ params: inventoryTransferParams }), controller.get);
  router.post('/', authorizeCompany('inventory.transfers_create'), validate({ body: createInventoryTransferBody }), controller.create);
  router.post('/relocations', authorizeCompany('inventory.relocations_create'), validate({ body: createInventoryRelocationBody }), controller.relocate);
  router.post('/:id/dispatch', authorizeCompany('inventory.transfers_dispatch'), validate({ params: inventoryTransferParams, body: inventoryTransferTransitionBody }), controller.dispatch);
  router.post('/:id/receive', authorizeCompany('inventory.transfers_receive'), validate({ params: inventoryTransferParams, body: inventoryTransferTransitionBody }), controller.receive);
  router.post('/:id/incident', authorizeCompany('inventory.transfers_receive'), validate({ params: inventoryTransferParams, body: inventoryTransferReasonBody }), controller.incident);
  router.post('/:id/cancel', authorizeCompany('inventory.transfers_cancel'), validate({ params: inventoryTransferParams, body: inventoryTransferReasonBody }), controller.cancel);
  return router;
}
