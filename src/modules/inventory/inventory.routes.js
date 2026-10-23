import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createInventoryController } from './inventory.controller.js';
import {
  inventoryEligibleReceiptsQuery,
  inventoryReceiptParams,
  postInventoryReceiptBody,
} from './inventory.schemas.js';

export function createInventoryRouter(service, auditService) {
  const router = Router();
  const controller = createInventoryController(service, auditService);
  router.use(authenticate);
  router.get('/eligible-receipts', authorizeCompany('inventory.receive'),
    validate({ query: inventoryEligibleReceiptsQuery }), controller.eligibleReceipts);
  router.post('/receipts/:purchaseId/post', authorizeCompany('inventory.receive'),
    validate({ params: inventoryReceiptParams, body: postInventoryReceiptBody }),
    controller.postReceipt);
  return router;
}
