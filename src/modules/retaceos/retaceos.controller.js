import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createRetaceosController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, action, resourceId, operation, metadata) =>
    auditService ? auditService.execute({
      actorUserId: request.auth.userId,
      action,
      resourceType: 'retaceo',
      resourceId,
      context: auditRequestContext(request),
      metadata: { companyId: request.tenant.companyId, ...metadata },
    }, operation) : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.retaceos, { meta: { pagination: result.pagination } });
    },
    async eligiblePurchases(request, response) {
      const result = await service.eligiblePurchases(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.purchases, { meta: { pagination: result.pagination } });
    },
    async get(request, response) {
      return sendSuccess(response, await service.get(request.tenant.companyId, request.validated.params.id));
    },
    async create(request, response) {
      return sendSuccess(response, await audited(
        request, auditActions.retaceoCreated, (value) => value.id,
        () => service.create(request.tenant.companyId, request.validated.body, context(request)),
      ), { statusCode: 201 });
    },
    async update(request, response) {
      return sendSuccess(response, await audited(
        request, auditActions.retaceoUpdated, request.validated.params.id,
        () => service.update(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request)),
      ));
    },
    async createCost(request, response) {
      return sendSuccess(response, await audited(
        request, auditActions.retaceoCostCreated, request.validated.params.id,
        () => service.createCost(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request)),
      ), { statusCode: 201 });
    },
    async updateCost(request, response) {
      return sendSuccess(response, await audited(
        request, auditActions.retaceoCostUpdated, request.validated.params.id,
        () => service.updateCost(request.tenant.companyId, request.validated.params.id, request.validated.params.costId, request.validated.body, context(request)),
        { costId: request.validated.params.costId },
      ));
    },
    async deleteCost(request, response) {
      return sendSuccess(response, await audited(
        request, auditActions.retaceoCostDeleted, request.validated.params.id,
        () => service.deleteCost(request.tenant.companyId, request.validated.params.id, request.validated.params.costId, request.validated.body, context(request)),
        { costId: request.validated.params.costId },
      ));
    },
  };
}
