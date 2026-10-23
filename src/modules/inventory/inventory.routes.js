import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createInventoryController } from './inventory.controller.js';
import {
  inventoryEligibleReceiptsQuery,
  inventoryReceiptParams,
  postInventoryReceiptBody,
  inventoryLotsQuery,
  inventoryLotParams,
  assignInventoryLocationBody,
  printInventoryLabelsBody,
  inventoryStockQuery,
  inventoryKardexQuery,
  inventoryCostsQuery,
} from './inventory.schemas.js';

export function createInventoryRouter(service, auditService) {
  const router = Router();
  const controller = createInventoryController(service, auditService);
  router.use(authenticate);
  router.get('/stock', authorizeCompany('inventory.read'),
    validate({ query: inventoryStockQuery }), controller.listStock);
  router.get('/kardex', authorizeCompany('inventory.kardex_read'),
    validate({ query: inventoryKardexQuery }), controller.listKardex);
  router.get('/costs', authorizeCompany('inventory.costs_read'),
    validate({ query: inventoryCostsQuery }), controller.listCosts);
  router.get('/lots', authorizeCompany('inventory.lots_read'),
    validate({ query: inventoryLotsQuery }), controller.listLots);
  router.get('/lots/:id', authorizeCompany('inventory.lots_read'),
    validate({ params: inventoryLotParams }), controller.getLot);
  router.post('/lots/:id/locations', authorizeCompany('inventory.locations_assign'),
    validate({ params: inventoryLotParams, body: assignInventoryLocationBody }),
    controller.assignLocation);
  router.post('/lots/:id/labels', authorizeCompany('inventory.labels_print'),
    validate({ params: inventoryLotParams, body: printInventoryLabelsBody }),
    controller.printLabels);
  router.get('/eligible-receipts', authorizeCompany('inventory.receive'),
    validate({ query: inventoryEligibleReceiptsQuery }), controller.eligibleReceipts);
  router.post('/receipts/:purchaseId/post', authorizeCompany('inventory.receive'),
    validate({ params: inventoryReceiptParams, body: postInventoryReceiptBody }),
    controller.postReceipt);
  return router;
}
