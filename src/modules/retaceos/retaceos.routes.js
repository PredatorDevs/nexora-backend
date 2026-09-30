import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createRetaceosController } from './retaceos.controller.js';
import {
  createRetaceoBody, createRetaceoCostBody, deleteRetaceoCostBody,
  eligiblePurchasesQuery, retaceoCostParams, retaceoIdParams,
  retaceosListQuery, updateRetaceoBody, updateRetaceoCostBody,
} from './retaceos.schemas.js';

export function createRetaceosRouter(service, auditService) {
  const router = Router();
  const controller = createRetaceosController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('retaceos.read'), validate({ query: retaceosListQuery }), controller.list);
  router.get('/eligible-purchases', authorizeCompany('retaceos.create'), validate({ query: eligiblePurchasesQuery }), controller.eligiblePurchases);
  router.get('/:id', authorizeCompany('retaceos.read'), validate({ params: retaceoIdParams }), controller.get);
  router.post('/', authorizeCompany('retaceos.create'), validate({ body: createRetaceoBody }), controller.create);
  router.put('/:id', authorizeCompany('retaceos.update'), validate({ params: retaceoIdParams, body: updateRetaceoBody }), controller.update);
  router.post('/:id/costs', authorizeCompany('retaceos.update'), validate({ params: retaceoIdParams, body: createRetaceoCostBody }), controller.createCost);
  router.put('/:id/costs/:costId', authorizeCompany('retaceos.update'), validate({ params: retaceoCostParams, body: updateRetaceoCostBody }), controller.updateCost);
  router.delete('/:id/costs/:costId', authorizeCompany('retaceos.update'), validate({ params: retaceoCostParams, body: deleteRetaceoCostBody }), controller.deleteCost);
  return router;
}
