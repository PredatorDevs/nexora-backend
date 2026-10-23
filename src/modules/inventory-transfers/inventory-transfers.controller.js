import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';

export function createInventoryTransfersController(service, auditService) {
  const context = (request) => ({ actorUserId: request.auth.userId });
  const audited = (request, action, operation) => auditService ? auditService.execute({
    actorUserId: request.auth.userId, action, resourceType: 'inventory_transfer',
    resourceId: request.validated.params?.id ?? ((value) => value.id),
    context: auditRequestContext(request), metadata: { companyId: request.tenant.companyId },
  }, operation) : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.transfers, { meta: { pagination: result.pagination } });
    },
    async get(request, response) {
      return sendSuccess(response, await service.get(request.tenant.companyId, request.validated.params.id));
    },
    async create(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_TRANSFER.CREATED', () =>
        service.create(request.tenant.companyId, request.validated.body, context(request))), { statusCode: 201 });
    },
    async relocate(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_RELOCATION.CREATED', () =>
        service.relocate(request.tenant.companyId, request.validated.body, context(request))), { statusCode: 201 });
    },
    async dispatch(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_TRANSFER.DISPATCHED', () =>
        service.dispatch(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))));
    },
    async receive(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_TRANSFER.RECEIVED', () =>
        service.receive(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))));
    },
    async incident(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_TRANSFER.INCIDENT', () =>
        service.incident(request.tenant.companyId, request.validated.params.id, request.validated.body)));
    },
    async cancel(request, response) {
      return sendSuccess(response, await audited(request, 'INVENTORY_TRANSFER.CANCELLED', () =>
        service.cancel(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))));
    },
  };
}
