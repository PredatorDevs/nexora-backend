import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createPurchaseRequestsController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, action, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            action,
            resourceType: 'purchase_request',
            resourceId:
              request.validated.params?.id ?? ((value) => value.id),
            context: auditRequestContext(request),
            metadata: { companyId: request.tenant.companyId },
          },
          operation,
        )
      : Promise.resolve().then(operation);
  const mutate = (method, action, statusCode) => async (request, response) =>
    sendSuccess(
      response,
      await audited(request, action, () =>
        service[method](
          request.tenant.companyId,
          request.validated.params?.id,
          request.validated.body,
          context(request),
        ),
      ),
      statusCode ? { statusCode } : undefined,
    );
  return {
    async list(request, response) {
      const result = await service.list(
        request.tenant.companyId,
        request.validated.query,
      );
      return sendSuccess(response, result.purchaseRequests, {
        meta: { pagination: result.pagination },
      });
    },
    async get(request, response) {
      return sendSuccess(
        response,
        await service.get(
          request.tenant.companyId,
          request.validated.params.id,
        ),
      );
    },
    create: async (request, response) =>
      sendSuccess(
        response,
        await audited(request, auditActions.purchaseRequestCreated, () =>
          service.create(
            request.tenant.companyId,
            request.validated.body,
            context(request),
          ),
        ),
        { statusCode: 201 },
      ),
    update: mutate('update', auditActions.purchaseRequestUpdated),
    submit: mutate('submit', auditActions.purchaseRequestSubmitted),
    approve: mutate('approve', auditActions.purchaseRequestApproved),
    reject: mutate('reject', auditActions.purchaseRequestRejected),
    cancel: mutate('cancel', auditActions.purchaseRequestCancelled),
  };
}
