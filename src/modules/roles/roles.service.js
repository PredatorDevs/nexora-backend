import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { roleSnapshot } from '../entity-changes/entity-change.snapshots.js';
const missing = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested role was not found.',
    statusCode: 404,
  });
export function createRolesService({
  repository,
  rbacService,
  entityChangeService,
  runInTransaction,
}) {
  const recordChange = (
    { operation, context, oldRole = null, newRole = null },
    client,
  ) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.administration,
        entityType: entityTypes.role,
        entityId: newRole?.id ?? oldRole.id,
        operation,
        context,
        oldValues: roleSnapshot(oldRole),
        newValues: roleSnapshot(newRole),
      },
      client,
    );
  return {
    async list(query) {
      const result = await repository.list(query);
      return {
        roles: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(id) {
      const role = await repository.findById(id);
      if (!role) throw missing();
      return role;
    },
    create(data, context) {
      return runInTransaction(async (client) => {
        const created = await repository.create(
          { ...data, isSystem: false },
          client,
        );
        await recordChange(
          {
            operation: entityChangeOperations.create,
            context,
            newRole: created,
          },
          client,
        );
        return created;
      });
    },
    async update(id, data, context) {
      const role = await repository.findById(id);
      if (!role) throw missing();
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('role', role.updatedAt);
        await recordChange(
          {
            operation: entityChangeOperations.update,
            context,
            oldRole: role,
            newRole: updated,
          },
          client,
        );
        return updated;
      });
    },
    async delete(id, expectedUpdatedAt, context) {
      const role = await repository.findById(id);
      if (!role) throw missing();
      await rbacService.deleteRole(id, expectedUpdatedAt, context, role);
    },
    async replacePermissions({
      roleId,
      permissionCodes,
      actorUserId,
      expectedUpdatedAt,
      context,
    }) {
      await rbacService.replaceRolePermissions({
        roleId,
        permissionCodes,
        actorUserId,
        expectedUpdatedAt,
        context,
      });
      return this.get(roleId);
    },
  };
}
