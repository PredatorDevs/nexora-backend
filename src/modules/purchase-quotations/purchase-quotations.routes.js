import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createPurchaseQuotationsController } from './purchase-quotations.controller.js';
import {
  createPurchaseQuotationBody,
  purchaseQuotationIdParams,
  purchaseQuotationReasonTransitionBody,
  purchaseQuotationsListQuery,
  purchaseQuotationTransitionBody,
  replacePurchaseQuotationRequestLinksBody,
  replacePurchaseQuotationExpensesBody,
  updatePurchaseQuotationBody,
} from './purchase-quotations.schemas.js';
export function createPurchaseQuotationsRouter(service, auditService) {
  const router = Router(),
    controller = createPurchaseQuotationsController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('purchase_quotations.read'),
    validate({ query: purchaseQuotationsListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorizeCompany('purchase_quotations.read'),
    validate({ params: purchaseQuotationIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('purchase_quotations.create'),
    validate({ body: createPurchaseQuotationBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('purchase_quotations.update'),
    validate({
      params: purchaseQuotationIdParams,
      body: updatePurchaseQuotationBody,
    }),
    controller.update,
  );
  router.put(
    '/:id/request-links',
    authorizeCompany('purchase_quotations.link_requests'),
    validate({
      params: purchaseQuotationIdParams,
      body: replacePurchaseQuotationRequestLinksBody,
    }),
    controller.replaceRequestLinks,
  );
  router.put(
    '/:id/expenses',
    authorizeCompany('purchase_quotations.manage_expenses'),
    validate({
      params: purchaseQuotationIdParams,
      body: replacePurchaseQuotationExpensesBody,
    }),
    controller.replaceExpenses,
  );
  router.post(
    '/:id/receive',
    authorizeCompany('purchase_quotations.receive'),
    validate({
      params: purchaseQuotationIdParams,
      body: purchaseQuotationTransitionBody,
    }),
    controller.receive,
  );
  router.post(
    '/:id/review',
    authorizeCompany('purchase_quotations.review'),
    validate({
      params: purchaseQuotationIdParams,
      body: purchaseQuotationTransitionBody,
    }),
    controller.review,
  );
  router.post(
    '/:id/cancel',
    authorizeCompany('purchase_quotations.cancel'),
    validate({
      params: purchaseQuotationIdParams,
      body: purchaseQuotationReasonTransitionBody,
    }),
    controller.cancel,
  );
  router.post(
    '/:id/expire',
    authorizeCompany('purchase_quotations.expire'),
    validate({
      params: purchaseQuotationIdParams,
      body: purchaseQuotationTransitionBody,
    }),
    controller.expire,
  );
  return router;
}
