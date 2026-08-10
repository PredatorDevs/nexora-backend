import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
const missing = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested role was not found.',
    statusCode: 404,
  });
export function createRolesService({ repository, rbacService }) {
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
    create(data) {
      return repository.create({ ...data, isSystem: false });
    },
    async update(id, data) {
      const role = await repository.findById(id);
      if (!role) throw missing();
      const { expectedUpdatedAt, ...changes } = data;
      const updated = await repository.update(
        id,
        new Date(expectedUpdatedAt),
        changes,
      );
      if (!updated) throw concurrencyConflict('role', role.updatedAt);
      return updated;
    },
    async delete(id, expectedUpdatedAt) {
      await rbacService.deleteRole(id, expectedUpdatedAt);
    },
    async replacePermissions({
      roleId,
      permissionCodes,
      actorUserId,
      expectedUpdatedAt,
    }) {
      await rbacService.replaceRolePermissions({
        roleId,
        permissionCodes,
        actorUserId,
        expectedUpdatedAt,
      });
      return this.get(roleId);
    },
  };
}
