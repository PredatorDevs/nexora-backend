import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createPurchaseRequestsController } from './purchase-requests.controller.js';
import {
  createPurchaseRequestBody,
  purchaseRequestIdParams,
  purchaseRequestReasonTransitionBody,
  purchaseRequestsListQuery,
  purchaseRequestTransitionBody,
  updatePurchaseRequestBody,
} from './purchase-requests.schemas.js';

export function createPurchaseRequestsRouter(service, auditService) {
  const router = Router();
  const controller = createPurchaseRequestsController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('purchase_requests.read'),
    validate({ query: purchaseRequestsListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorizeCompany('purchase_requests.read'),
    validate({ params: purchaseRequestIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('purchase_requests.create'),
    validate({ body: createPurchaseRequestBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('purchase_requests.update'),
    validate({
      params: purchaseRequestIdParams,
      body: updatePurchaseRequestBody,
    }),
    controller.update,
  );
  router.post(
    '/:id/submit',
    authorizeCompany('purchase_requests.submit'),
    validate({
      params: purchaseRequestIdParams,
      body: purchaseRequestTransitionBody,
    }),
    controller.submit,
  );
  router.post(
    '/:id/approve',
    authorizeCompany('purchase_requests.approve'),
    validate({
      params: purchaseRequestIdParams,
      body: purchaseRequestTransitionBody,
    }),
    controller.approve,
  );
  router.post(
    '/:id/reject',
    authorizeCompany('purchase_requests.reject'),
    validate({
      params: purchaseRequestIdParams,
      body: purchaseRequestReasonTransitionBody,
    }),
    controller.reject,
  );
  router.post(
    '/:id/cancel',
    authorizeCompany('purchase_requests.cancel'),
    validate({
      params: purchaseRequestIdParams,
      body: purchaseRequestReasonTransitionBody,
    }),
    controller.cancel,
  );
  return router;
}
