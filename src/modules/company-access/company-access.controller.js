import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createCompanyAccessController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.auth.companyId,
    membershipId: request.auth.membershipId,
  });
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            context: auditRequestContext(request),
            ...event,
            metadata: {
              companyId: request.validated.params.companyId,
              ...event.metadata,
            },
          },
          operation,
        )
      : Promise.resolve().then(operation);

  return {
    async listMemberships(request, response) {
      const result = await service.listMemberships(
        request.validated.params.companyId,
        request.validated.query,
      );
      return sendSuccess(response, result.memberships, {
        meta: { pagination: result.pagination },
      });
    },
    async getMembership(request, response) {
      const { companyId, membershipId } = request.validated.params;
      return sendSuccess(
        response,
        await service.getMembership(companyId, membershipId),
      );
    },
    async addMembership(request, response) {
      const { companyId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyMemberAdded,
            resourceType: 'company_membership',
            resourceId: (membership) => membership.id,
          },
          () =>
            service.addMembership(
              companyId,
              request.validated.body,
              request.auth.userId,
              context(request),
            ),
        ),
        { statusCode: 201 },
      );
    },
    async changeMembershipStatus(request, response) {
      const { companyId, membershipId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyMemberStatusChanged,
            resourceType: 'company_membership',
            resourceId: membershipId,
            metadata: { status: request.validated.body.status },
          },
          () =>
            service.changeMembershipStatus(
              companyId,
              membershipId,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
    async replaceMembershipRoles(request, response) {
      const { companyId, membershipId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyMemberRolesChanged,
            resourceType: 'company_membership',
            resourceId: membershipId,
            metadata: { roleIds: request.validated.body.roleIds },
          },
          () =>
            service.replaceMembershipRoles(
              companyId,
              membershipId,
              request.validated.body,
              request.auth.userId,
              context(request),
            ),
        ),
      );
    },
    async listRoles(request, response) {
      const result = await service.listRoles(
        request.validated.params.companyId,
        request.validated.query,
      );
      return sendSuccess(response, result.roles, {
        meta: { pagination: result.pagination },
      });
    },
    async getRole(request, response) {
      const { companyId, roleId } = request.validated.params;
      return sendSuccess(response, await service.getRole(companyId, roleId));
    },
    async createRole(request, response) {
      const { companyId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyRoleCreated,
            resourceType: 'company_role',
            resourceId: (role) => role.id,
          },
          () =>
            service.createRole(
              companyId,
              request.validated.body,
              context(request),
            ),
        ),
        { statusCode: 201 },
      );
    },
    async updateRole(request, response) {
      const { companyId, roleId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyRoleUpdated,
            resourceType: 'company_role',
            resourceId: roleId,
          },
          () =>
            service.updateRole(
              companyId,
              roleId,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
    async deleteRole(request, response) {
      const { companyId, roleId } = request.validated.params;
      await audited(
        request,
        {
          action: auditActions.companyRoleDeleted,
          resourceType: 'company_role',
          resourceId: roleId,
        },
        () =>
          service.deleteRole(
            companyId,
            roleId,
            request.validated.query.expectedUpdatedAt,
            context(request),
          ),
      );
      return response.status(204).send();
    },
    async replaceRolePermissions(request, response) {
      const { companyId, roleId } = request.validated.params;
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyRolePermissionsChanged,
            resourceType: 'company_role',
            resourceId: roleId,
            metadata: {
              permissionCodes: request.validated.body.permissionCodes,
            },
          },
          () =>
            service.replaceRolePermissions(
              companyId,
              roleId,
              request.validated.body,
              request.auth.userId,
              context(request),
            ),
        ),
      );
    },
  };
}
