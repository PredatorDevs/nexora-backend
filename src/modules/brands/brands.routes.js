import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createBrandsController } from './brands.controller.js';
import {
  brandIdParams,
  brandsListQuery,
  createBrandBody,
  updateBrandBody,
  updateBrandStatusBody,
} from './brands.schemas.js';
export function createBrandsRouter(service, auditService) {
  const router = Router();
  const c = createBrandsController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('brands.read'),
    validate({ query: brandsListQuery }),
    c.list,
  );
  router.get(
    '/:id',
    authorizeCompany('brands.read'),
    validate({ params: brandIdParams }),
    c.get,
  );
  router.post(
    '/',
    authorizeCompany('brands.create'),
    validate({ body: createBrandBody }),
    c.create,
  );
  router.put(
    '/:id',
    authorizeCompany('brands.update'),
    validate({ params: brandIdParams, body: updateBrandBody }),
    c.update,
  );
  router.patch(
    '/:id/status',
    authorizeCompany('brands.change_status'),
    validate({ params: brandIdParams, body: updateBrandStatusBody }),
    c.changeStatus,
  );
  return router;
}
