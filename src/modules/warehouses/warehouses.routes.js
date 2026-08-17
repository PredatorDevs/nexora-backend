import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createWarehousesController } from './warehouses.controller.js';
import { createWarehouseBody, updateWarehouseBody, updateWarehouseStatusBody, warehouseIdParams, warehousesListQuery } from './warehouses.schemas.js';

export function createWarehousesRouter(service, auditService) {
  const router = Router();
  const controller = createWarehousesController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('warehouses.read'), validate({ query: warehousesListQuery }), controller.list);
  router.get('/:id', authorizeCompany('warehouses.read'), validate({ params: warehouseIdParams }), controller.get);
  router.post('/', authorizeCompany('warehouses.create'), validate({ body: createWarehouseBody }), controller.create);
  router.put('/:id', authorizeCompany('warehouses.update'), validate({ params: warehouseIdParams, body: updateWarehouseBody }), controller.update);
  router.patch('/:id/status', authorizeCompany('warehouses.change_status'), validate({ params: warehouseIdParams, body: updateWarehouseStatusBody }), controller.changeStatus);
  return router;
}
