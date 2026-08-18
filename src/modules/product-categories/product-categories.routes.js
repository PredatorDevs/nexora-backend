import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createProductCategoriesController } from './product-categories.controller.js';
import {
  createProductCategoryBody,
  productCategoriesListQuery,
  productCategoryIdParams,
  updateProductCategoryBody,
  updateProductCategoryStatusBody,
} from './product-categories.schemas.js';
export function createProductCategoriesRouter(service, auditService) {
  const r = Router(),
    c = createProductCategoriesController(service, auditService);
  r.use(authenticate);
  r.get(
    '/',
    authorizeCompany('product_categories.read'),
    validate({ query: productCategoriesListQuery }),
    c.list,
  );
  r.get(
    '/:id',
    authorizeCompany('product_categories.read'),
    validate({ params: productCategoryIdParams }),
    c.get,
  );
  r.post(
    '/',
    authorizeCompany('product_categories.create'),
    validate({ body: createProductCategoryBody }),
    c.create,
  );
  r.put(
    '/:id',
    authorizeCompany('product_categories.update'),
    validate({
      params: productCategoryIdParams,
      body: updateProductCategoryBody,
    }),
    c.update,
  );
  r.patch(
    '/:id/status',
    authorizeCompany('product_categories.change_status'),
    validate({
      params: productCategoryIdParams,
      body: updateProductCategoryStatusBody,
    }),
    c.changeStatus,
  );
  return r;
}
