import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createProductsController } from './products.controller.js';
import {
  createProductBody,
  productIdParams,
  productsListQuery,
  updateProductBody,
  updateProductStatusBody,
} from './products.schemas.js';

export function createProductsRouter(service, auditService) {
  const router = Router();
  const controller = createProductsController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('products.read'),
    validate({ query: productsListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorizeCompany('products.read'),
    validate({ params: productIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('products.create'),
    validate({ body: createProductBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('products.update'),
    validate({ params: productIdParams, body: updateProductBody }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    authorizeCompany('products.change_status'),
    validate({ params: productIdParams, body: updateProductStatusBody }),
    controller.changeStatus,
  );
  return router;
}
