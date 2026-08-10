import { sendSuccess } from '../../core/http/responses.js';
import { auditRequestContext } from '../../core/audit/request-context.js';
import { auditActions } from '../audit/audit.constants.js';

export function createRolesController(service, auditService) {
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            resourceType: 'role',
            context: auditRequestContext(request),
            ...event,
          },
          operation,
        )
      : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.roles, {
        meta: { pagination: result.pagination },
      });
    },
    async get(request, response) {
      return sendSuccess(
        response,
        await service.get(request.validated.params.id),
      );
    },
    async create(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.roleCreated,
            resourceId: (role) => role?.id ?? null,
          },
          () => service.create(request.validated.body),
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
            action: auditActions.roleUpdated,
            resourceId: request.validated.params.id,
            metadata: { fields: Object.keys(request.validated.body) },
          },
          () =>
            service.update(request.validated.params.id, request.validated.body),
        ),
      );
    },
    async delete(request, response) {
      await audited(
        request,
        {
          action: auditActions.roleDeleted,
          resourceId: request.validated.params.id,
        },
        () =>
          service.delete(
            request.validated.params.id,
            request.validated.query.expectedUpdatedAt,
          ),
      );
      return response.status(204).send();
    },
    async replacePermissions(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.rolePermissionsChanged,
            resourceId: request.validated.params.id,
            metadata: {
              permissionCodes: request.validated.body.permissionCodes,
            },
          },
          () =>
            service.replacePermissions({
              roleId: request.validated.params.id,
              permissionCodes: request.validated.body.permissionCodes,
              actorUserId: request.auth.userId,
              expectedUpdatedAt: request.validated.body.expectedUpdatedAt,
            }),
        ),
      );
    },
  };
}
