import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';

export function createInventoryAdjustmentsController(service, auditService) {
  const context = (request) => ({ actorUserId: request.auth.userId });
  const audited = (request, action, resourceType, operation) => auditService ? auditService.execute({
    actorUserId: request.auth.userId, action, resourceType,
    resourceId: request.validated.params?.id ?? ((value) => value.id),
    context: auditRequestContext(request), metadata: { companyId: request.tenant.companyId },
  }, operation) : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.adjustments, { meta: { pagination: result.pagination } });
    },
    async get(request, response) { return sendSuccess(response, await service.get(request.tenant.companyId, request.validated.params.id)); },
    async create(request, response) {
      const result = await audited(request, 'INVENTORY_ADJUSTMENT.CREATED', 'inventory_adjustment', () => service.create(request.tenant.companyId, request.validated.body, context(request)));
      return sendSuccess(response, result, { statusCode: 201 });
    },
    async approve(request, response) { return sendSuccess(response, await audited(request, 'INVENTORY_ADJUSTMENT.APPROVED', 'inventory_adjustment', () => service.approve(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request)))); },
    async cancel(request, response) { return sendSuccess(response, await audited(request, 'INVENTORY_ADJUSTMENT.CANCELLED', 'inventory_adjustment', () => service.cancel(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request)))); },
    async reverseMovement(request, response) { return sendSuccess(response, await audited(request, 'INVENTORY_MOVEMENT.REVERSED', 'inventory_movement', () => service.reverseMovement(request.tenant.companyId, request.validated.params.id, request.validated.body, context(request))), { statusCode: 201 }); },
  };
}

