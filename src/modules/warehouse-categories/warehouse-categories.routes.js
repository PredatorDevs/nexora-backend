import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createWarehouseCategoriesController } from './warehouse-categories.controller.js';
import { createWarehouseCategoryBody, updateWarehouseCategoryBody, updateWarehouseCategoryStatusBody, warehouseCategoriesListQuery, warehouseCategoryIdParams } from './warehouse-categories.schemas.js';

export function createWarehouseCategoriesRouter(service, auditService) {
  const router = Router();
  const controller = createWarehouseCategoriesController(service, auditService);
  router.use(authenticate);
  router.get('/', authorizeCompany('warehouse_categories.read'), validate({ query: warehouseCategoriesListQuery }), controller.list);
  router.get('/:id', authorizeCompany('warehouse_categories.read'), validate({ params: warehouseCategoryIdParams }), controller.get);
  router.post('/', authorizeCompany('warehouse_categories.create'), validate({ body: createWarehouseCategoryBody }), controller.create);
  router.put('/:id', authorizeCompany('warehouse_categories.update'), validate({ params: warehouseCategoryIdParams, body: updateWarehouseCategoryBody }), controller.update);
  router.patch('/:id/status', authorizeCompany('warehouse_categories.change_status'), validate({ params: warehouseCategoryIdParams, body: updateWarehouseCategoryStatusBody }), controller.changeStatus);
  return router;
}
