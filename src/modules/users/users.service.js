import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { systemRoleCodes } from '../rbac/rbac.constants.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { userSnapshot } from '../entity-changes/entity-change.snapshots.js';
const missingUser = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested user was not found.',
    statusCode: 404,
  });
export function createUsersService({
  repository,
  rbacService,
  passwordHasher,
  entityChangeService,
  runInTransaction,
}) {
  const recordChange = (
    { operation, context, oldUser = null, newUser = null, metadata },
    client,
  ) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.administration,
        entityType: entityTypes.user,
        entityId: newUser?.id ?? oldUser.id,
        operation,
        context,
        oldValues: userSnapshot(oldUser),
        newValues: userSnapshot(newUser),
        metadata,
      },
      client,
    );
  const service = {
    async list(query) {
      const result = await repository.list(query);
      return {
        users: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(id) {
      const user = await repository.findById(id);
      if (!user) throw missingUser();
      return user;
    },
    async create(data, context) {
      const passwordHash = await passwordHasher(data.password);
      return runInTransaction(async (client) => {
        const created = await repository.create(
          {
            email: data.email,
            displayName: data.displayName,
            passwordHash,
            mustChangePassword: data.mustChangePassword,
          },
          client,
        );
        await recordChange(
          {
            operation: entityChangeOperations.create,
            context,
            newUser: created,
          },
          client,
        );
        return created;
      });
    },
    async update(id, data, context) {
      const { expectedUpdatedAt, ...changes } = data;
      const current = await repository.findById(id);
      if (!current) throw missingUser();
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('user', current.updatedAt);
        await recordChange(
          {
            operation: entityChangeOperations.update,
            context,
            oldUser: current,
            newUser: updated,
          },
          client,
        );
        return updated;
      });
    },
    async changeStatus({
      userId,
      status,
      actorUserId,
      expectedUpdatedAt,
      context,
    }) {
      if (userId === actorUserId)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'Users cannot change their own status.',
          statusCode: 409,
        });
      const user = await repository.findById(userId);
      if (!user) throw missingUser();
      if (
        status === 'INACTIVE' &&
        user.status === 'ACTIVE' &&
        (await repository.hasRoleCode(userId, systemRoleCodes.superAdmin)) &&
        (await repository.countActiveUsersWithRoleCode(
          systemRoleCodes.superAdmin,
        )) <= 1
      )
        throw new AppError({
          code: errorCodes.conflict,
          message: 'The system must retain an active super administrator.',
          statusCode: 409,
        });
      return runInTransaction(
        async (client) => {
          const updated = await repository.changeStatus(
            userId,
            status,
            new Date(expectedUpdatedAt),
            systemRoleCodes.superAdmin,
            client,
          );
          if (updated?.conflict === 'LAST_SUPER_ADMIN')
            throw new AppError({
              code: errorCodes.conflict,
              message: 'The system must retain an active super administrator.',
              statusCode: 409,
            });
          if (!updated) throw concurrencyConflict('user', user.updatedAt);
          await recordChange(
            {
              operation: entityChangeOperations.update,
              context,
              oldUser: user,
              newUser: updated,
              metadata: { reason: 'STATUS_CHANGE' },
            },
            client,
          );
          return updated;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async replaceRoles({
      userId,
      roleIds,
      actorUserId,
      expectedUpdatedAt,
      context,
    }) {
      await rbacService.replaceUserRoles({
        userId,
        roleIds,
        actorUserId,
        expectedUpdatedAt,
        context,
      });
      return service.get(userId);
    },
    async resetPassword(userId, data, actorUserId, context) {
      if (userId === actorUserId)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'Use the account endpoint to change your own password.',
          statusCode: 409,
        });
      const current = await repository.findById(userId);
      if (!current) throw missingUser();
      const passwordHash = await passwordHasher(data.password);
      return runInTransaction(async (client) => {
        const updated = await repository.resetPassword(
          userId,
          {
            passwordHash,
            mustChangePassword: data.mustChangePassword,
            expectedUpdatedAt: new Date(data.expectedUpdatedAt),
          },
          client,
        );
        if (!updated) throw concurrencyConflict('user', current.updatedAt);
        await recordChange(
          {
            operation: entityChangeOperations.update,
            context,
            oldUser: current,
            newUser: updated,
            metadata: { reason: 'ADMIN_PASSWORD_RESET' },
          },
          client,
        );
        return updated;
      });
    },
  };
  return service;
}
