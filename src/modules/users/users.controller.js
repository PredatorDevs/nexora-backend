import { sendSuccess } from '../../core/http/responses.js';
import { auditRequestContext } from '../../core/audit/request-context.js';
import { auditActions } from '../audit/audit.constants.js';

export function createUsersController(service, auditService) {
  const changeContext = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
  });
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            resourceType: 'user',
            context: auditRequestContext(request),
            ...event,
          },
          operation,
        )
      : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.users, {
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
            action: auditActions.userCreated,
            resourceId: (user) => user?.id ?? null,
          },
          () => service.create(request.validated.body, changeContext(request)),
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
            action: auditActions.userUpdated,
            resourceId: request.validated.params.id,
            metadata: { fields: Object.keys(request.validated.body) },
          },
          () =>
            service.update(
              request.validated.params.id,
              request.validated.body,
              changeContext(request),
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
            action: auditActions.userStatusChanged,
            resourceId: request.validated.params.id,
            metadata: { status: request.validated.body.status },
          },
          () =>
            service.changeStatus({
              userId: request.validated.params.id,
              status: request.validated.body.status,
              actorUserId: request.auth.userId,
              expectedUpdatedAt: request.validated.body.expectedUpdatedAt,
              context: changeContext(request),
            }),
        ),
      );
    },
    async replaceRoles(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.userRolesChanged,
            resourceId: request.validated.params.id,
            metadata: { roleIds: request.validated.body.roleIds },
          },
          () =>
            service.replaceRoles({
              userId: request.validated.params.id,
              roleIds: request.validated.body.roleIds,
              actorUserId: request.auth.userId,
              expectedUpdatedAt: request.validated.body.expectedUpdatedAt,
              context: changeContext(request),
            }),
        ),
      );
    },
    async resetPassword(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.userPasswordReset,
            resourceId: request.validated.params.id,
            metadata: {
              mustChangePassword: request.validated.body.mustChangePassword,
            },
          },
          () =>
            service.resetPassword(
              request.validated.params.id,
              request.validated.body,
              request.auth.userId,
              changeContext(request),
            ),
        ),
      );
    },
  };
}
