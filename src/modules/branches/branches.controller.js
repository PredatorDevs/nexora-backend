import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';
export function createBranchesController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            resourceType: 'branch',
            context: auditRequestContext(request),
            ...event,
            metadata: {
              companyId: request.tenant.companyId,
              ...event.metadata,
            },
          },
          operation,
        )
      : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(
        request.tenant.companyId,
        request.validated.query,
      );
      return sendSuccess(response, result.branches, {
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
    async create(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.branchCreated,
            resourceId: (branch) => branch.id,
          },
          () =>
            service.create(
              request.tenant.companyId,
              request.validated.body,
              context(request),
            ),
        ),
        { statusCode: 201 },
      );
    },
    async update(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.branchUpdated,
            resourceId: request.validated.params.id,
            metadata: { fields: Object.keys(request.validated.body) },
          },
          () =>
            service.update(
              request.tenant.companyId,
              request.validated.params.id,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
    async changeStatus(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.branchStatusChanged,
            resourceId: request.validated.params.id,
            metadata: { status: request.validated.body.status },
          },
          () =>
            service.changeStatus(
              request.tenant.companyId,
              request.validated.params.id,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
  };
}
