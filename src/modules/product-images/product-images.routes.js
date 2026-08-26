import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createProductImagesController } from './product-images.controller.js';
import {
  createProductImageBody,
  productImageConcurrencyBody,
  productImageParams,
  reorderProductImagesBody,
  updateProductImageBody,
} from './product-images.schemas.js';

export function createProductImagesRouter(service, auditService) {
  const router = Router({ mergeParams: true });
  const controller = createProductImagesController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('product_images.read'),
    validate({ params: productImageParams }),
    controller.list,
  );
  router.post(
    '/',
    authorizeCompany('product_images.create'),
    validate({ params: productImageParams, body: createProductImageBody }),
    controller.create,
  );
  router.put(
    '/order',
    authorizeCompany('product_images.update'),
    validate({ params: productImageParams, body: reorderProductImagesBody }),
    controller.reorder,
  );
  router.put(
    '/:imageId',
    authorizeCompany('product_images.update'),
    validate({ params: productImageParams, body: updateProductImageBody }),
    controller.update,
  );
  router.patch(
    '/:imageId/primary',
    authorizeCompany('product_images.update'),
    validate({ params: productImageParams, body: productImageConcurrencyBody }),
    controller.setPrimary,
  );
  router.delete(
    '/:imageId',
    authorizeCompany('product_images.delete'),
    validate({ params: productImageParams, body: productImageConcurrencyBody }),
    controller.remove,
  );
  return router;
}
