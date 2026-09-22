import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';
export function createPurchaseQuotationsController(service, auditService) {
  const context = (r) => ({
    actorUserId: r.auth.userId,
    requestId: r.id,
    companyId: r.tenant.companyId,
    membershipId: r.tenant.membershipId,
  });
  const audited = (r, action, op) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: r.auth.userId,
            action,
            resourceType: 'purchase_quotation',
            resourceId: r.validated.params?.id ?? ((v) => v.id),
            context: auditRequestContext(r),
            metadata: { companyId: r.tenant.companyId },
          },
          op,
        )
      : Promise.resolve().then(op);
  const mutate = (method, action) => async (r, s) =>
    sendSuccess(
      s,
      await audited(r, action, () =>
        service[method](
          r.tenant.companyId,
          r.validated.params.id,
          r.validated.body,
          context(r),
        ),
      ),
    );
  return {
    async list(r, s) {
      const value = await service.list(r.tenant.companyId, r.validated.query);
      return sendSuccess(s, value.purchaseQuotations, {
        meta: { pagination: value.pagination },
      });
    },
    async get(r, s) {
      return sendSuccess(
        s,
        await service.get(r.tenant.companyId, r.validated.params.id),
      );
    },
    async create(r, s) {
      return sendSuccess(
        s,
        await audited(r, auditActions.purchaseQuotationCreated, () =>
          service.create(r.tenant.companyId, r.validated.body, context(r)),
        ),
        { statusCode: 201 },
      );
    },
    update: mutate('update', auditActions.purchaseQuotationUpdated),
    replaceRequestLinks: mutate(
      'replaceRequestLinks',
      auditActions.purchaseQuotationRequestsLinked,
    ),
    receive: mutate('receive', auditActions.purchaseQuotationReceived),
    review: mutate('review', auditActions.purchaseQuotationReviewStarted),
    cancel: mutate('cancel', auditActions.purchaseQuotationCancelled),
    expire: mutate('expire', auditActions.purchaseQuotationExpired),
  };
}
