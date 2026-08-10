import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { isPermissionCode, systemRoleCodes } from './rbac.constants.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { roleSnapshot } from '../entity-changes/entity-change.snapshots.js';

const unique = (values) => [...new Set(values)];
const notFound = (message) =>
  new AppError({ code: errorCodes.notFound, message, statusCode: 404 });
const invalid = (message, details) =>
  new AppError({
    code: errorCodes.validation,
    message,
    statusCode: 400,
    details,
  });

export function createRbacService({
  repository,
  runInTransaction,
  entityChangeService,
}) {
  return {
    getPermissionCodes(userId) {
      return repository.findPermissionCodesForUser(userId);
    },
    async hasPermission(userId, permissionCode) {
      return (await repository.findPermissionCodesForUser(userId)).includes(
        permissionCode,
      );
    },
    async replaceRolePermissions({
      roleId,
      permissionCodes,
      actorUserId,
      expectedUpdatedAt,
      context,
    }) {
      const role = await repository.findRoleById(roleId);
      if (!role) throw notFound('The requested role was not found.');
      const codes = unique(permissionCodes);
      const malformed = codes.filter((code) => !isPermissionCode(code));
      if (malformed.length)
        throw invalid('Some permission codes are invalid.', {
          invalidPermissionCodes: malformed,
        });
      const permissions = await repository.findPermissionsByCodes(codes);
      const existing = new Set(permissions.map(({ code }) => code));
      const missing = codes.filter((code) => !existing.has(code));
      if (missing.length)
        throw invalid('Some permissions do not exist.', {
          missingPermissionCodes: missing,
        });
      await runInTransaction(async (client) => {
        const claimed = await repository.claimRoleVersion(
          roleId,
          new Date(expectedUpdatedAt),
          client,
        );
        if (claimed.count !== 1)
          throw concurrencyConflict('role', role.updatedAt);
        await repository.replaceRolePermissions(
          { roleId, permissions, assignedByUserId: actorUserId },
          client,
        );
        await entityChangeService?.record(
          {
            schemaName: entitySchemas.administration,
            entityType: entityTypes.role,
            entityId: roleId,
            operation: entityChangeOperations.update,
            context,
            oldValues: {
              permissionCodes:
                role.permissions
                  ?.map(({ permission }) => permission.code)
                  .sort() ?? [],
            },
            newValues: { permissionCodes: codes.slice().sort() },
            metadata: { reason: 'PERMISSION_ASSIGNMENT' },
          },
          client,
        );
      });
      return { roleId, permissionCodes: codes };
    },
    async replaceUserRoles({
      userId,
      roleIds,
      actorUserId,
      expectedUpdatedAt,
      context,
    }) {
      const user = await repository.findUserWithRoles(userId);
      if (!user) throw notFound('The requested user was not found.');
      if (userId === actorUserId)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'Users cannot modify their own role assignments.',
          statusCode: 409,
        });
      const ids = unique(roleIds);
      const roles = await repository.findRolesByIds(ids);
      const existing = new Set(roles.map(({ id }) => id));
      const missing = ids.filter((id) => !existing.has(id));
      if (missing.length)
        throw invalid('Some roles do not exist.', { missingRoleIds: missing });
      const wasSuperAdmin = user.roles.some(
        ({ role }) => role.code === systemRoleCodes.superAdmin,
      );
      const remainsSuperAdmin = roles.some(
        ({ code }) => code === systemRoleCodes.superAdmin,
      );
      if (
        user.status === 'ACTIVE' &&
        wasSuperAdmin &&
        !remainsSuperAdmin &&
        (await repository.countActiveUsersWithRoleCode(
          systemRoleCodes.superAdmin,
        )) <= 1
      ) {
        throw new AppError({
          code: errorCodes.conflict,
          message: 'The system must retain an active super administrator.',
          statusCode: 409,
        });
      }
      await runInTransaction(
        async (client) => {
          const transactionalUser = await repository.findUserWithRoles(
            userId,
            client,
          );
          const transactionWasSuperAdmin = transactionalUser.roles.some(
            ({ role }) => role.code === systemRoleCodes.superAdmin,
          );
          if (
            transactionalUser.status === 'ACTIVE' &&
            transactionWasSuperAdmin &&
            !remainsSuperAdmin &&
            (await repository.countActiveUsersWithRoleCode(
              systemRoleCodes.superAdmin,
              client,
            )) <= 1
          )
            throw new AppError({
              code: errorCodes.conflict,
              message: 'The system must retain an active super administrator.',
              statusCode: 409,
            });
          const claimed = await repository.claimUserVersion(
            userId,
            new Date(expectedUpdatedAt),
            client,
          );
          if (claimed.count !== 1)
            throw concurrencyConflict('user', user.updatedAt);
          await repository.replaceUserRoles(
            { userId, roles, assignedByUserId: actorUserId },
            client,
          );
          await entityChangeService?.record(
            {
              schemaName: entitySchemas.administration,
              entityType: entityTypes.user,
              entityId: userId,
              operation: entityChangeOperations.update,
              context,
              oldValues: {
                roleCodes: transactionalUser.roles
                  .map(({ role }) => role.code)
                  .sort(),
              },
              newValues: {
                roleCodes: roles.map(({ code }) => code).sort(),
              },
              metadata: { reason: 'ROLE_ASSIGNMENT' },
            },
            client,
          );
        },
        { isolationLevel: 'Serializable' },
      );
      return { userId, roleIds: ids };
    },
    async deleteRole(roleId, expectedUpdatedAt, context, existingRole) {
      const role = existingRole ?? (await repository.findRoleById(roleId));
      if (!role) throw notFound('The requested role was not found.');
      if (role.isSystem)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'System roles cannot be deleted.',
          statusCode: 409,
        });
      await runInTransaction(async (client) => {
        const deleted = await repository.deleteRole(
          roleId,
          new Date(expectedUpdatedAt),
          client,
        );
        if (deleted.count !== 1)
          throw concurrencyConflict('role', role.updatedAt);
        await entityChangeService?.record(
          {
            schemaName: entitySchemas.administration,
            entityType: entityTypes.role,
            entityId: roleId,
            operation: entityChangeOperations.delete,
            context,
            oldValues: roleSnapshot(role),
            newValues: null,
          },
          client,
        );
      });
    },
  };
}
