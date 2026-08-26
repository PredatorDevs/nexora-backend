import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createProductUnitsController } from './product-units.controller.js';
import {
  createProductUnitBody,
  productUnitIdParams,
  productUnitsListQuery,
  updateProductUnitBody,
  updateProductUnitStatusBody,
} from './product-units.schemas.js';
export function createProductUnitsRouter(service, auditService) {
  const r = Router(),
    c = createProductUnitsController(service, auditService);
  r.use(authenticate);
  r.get(
    '/',
    authorizeCompany('product_units.read'),
    validate({ query: productUnitsListQuery }),
    c.list,
  );
  r.get(
    '/:id',
    authorizeCompany('product_units.read'),
    validate({ params: productUnitIdParams }),
    c.get,
  );
  r.post(
    '/',
    authorizeCompany('product_units.create'),
    validate({ body: createProductUnitBody }),
    c.create,
  );
  r.put(
    '/:id',
    authorizeCompany('product_units.update'),
    validate({ params: productUnitIdParams, body: updateProductUnitBody }),
    c.update,
  );
  r.patch(
    '/:id/status',
    authorizeCompany('product_units.change_status'),
    validate({
      params: productUnitIdParams,
      body: updateProductUnitStatusBody,
    }),
    c.changeStatus,
  );
  return r;
}
