import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createLocationsController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, event, operation) => auditService
    ? auditService.execute({
        actorUserId: request.auth.userId,
        resourceType: 'location',
        context: auditRequestContext(request),
        ...event,
        metadata: { companyId: request.tenant.companyId, ...event.metadata },
      }, operation)
    : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.locations, { meta: { pagination: result.pagination } });
    },
    async get(request, response) {
      return sendSuccess(response, await service.get(request.tenant.companyId, request.validated.params.id));
    },
    async create(request, response) {
      return sendSuccess(response, await audited(request, {
        action: auditActions.locationCreated,
        resourceId: (value) => value.id,
      }, () => service.create(request.tenant.companyId, request.validated.body, context(request))), { statusCode: 201 });
    },
    async update(request, response) {
      return sendSuccess(response, await audited(request, {
        action: auditActions.locationUpdated,
        resourceId: request.validated.params.id,
        metadata: { fields: Object.keys(request.validated.body) },
      }, () => service.update(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))));
    },
    async changeStatus(request, response) {
      return sendSuccess(response, await audited(request, {
        action: auditActions.locationStatusChanged,
        resourceId: request.validated.params.id,
        metadata: { isActive: request.validated.body.isActive },
      }, () => service.changeStatus(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))));
    },
  };
}
