import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { systemRoleCodes } from '../rbac/rbac.constants.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
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
}) {
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
    async create(data) {
      return repository.create({
        email: data.email,
        displayName: data.displayName,
        passwordHash: await passwordHasher(data.password),
        mustChangePassword: data.mustChangePassword,
      });
    },
    async update(id, data) {
      const { expectedUpdatedAt, ...changes } = data;
      const current = await repository.findById(id);
      if (!current) throw missingUser();
      const updated = await repository.update(
        id,
        new Date(expectedUpdatedAt),
        changes,
      );
      if (!updated) throw concurrencyConflict('user', current.updatedAt);
      return updated;
    },
    async changeStatus({ userId, status, actorUserId, expectedUpdatedAt }) {
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
      const updated = await repository.changeStatus(
        userId,
        status,
        new Date(expectedUpdatedAt),
        systemRoleCodes.superAdmin,
      );
      if (updated?.conflict === 'LAST_SUPER_ADMIN')
        throw new AppError({
          code: errorCodes.conflict,
          message: 'The system must retain an active super administrator.',
          statusCode: 409,
        });
      if (!updated) throw concurrencyConflict('user', user.updatedAt);
      return updated;
    },
    async replaceRoles({ userId, roleIds, actorUserId, expectedUpdatedAt }) {
      await rbacService.replaceUserRoles({
        userId,
        roleIds,
        actorUserId,
        expectedUpdatedAt,
      });
      return service.get(userId);
    },
    async resetPassword(userId, data, actorUserId) {
      if (userId === actorUserId)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'Use the account endpoint to change your own password.',
          statusCode: 409,
        });
      const current = await repository.findById(userId);
      if (!current) throw missingUser();
      const updated = await repository.resetPassword(userId, {
        passwordHash: await passwordHasher(data.password),
        mustChangePassword: data.mustChangePassword,
        expectedUpdatedAt: new Date(data.expectedUpdatedAt),
      });
      if (!updated) throw concurrencyConflict('user', current.updatedAt);
      return updated;
    },
  };
  return service;
}
