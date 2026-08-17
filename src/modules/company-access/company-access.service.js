import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../core/code-generation/business-code.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import {
  companyMembershipSnapshot,
  companyRoleSnapshot,
} from '../entity-changes/entity-change.snapshots.js';
import { isPermissionCode } from '../rbac/rbac.constants.js';

const unique = (values) => [...new Set(values)];
const notFound = (resource) =>
  new AppError({
    code: errorCodes.notFound,
    message: `The requested ${resource} was not found.`,
    statusCode: 404,
  });
const conflict = (message) =>
  new AppError({ code: errorCodes.conflict, message, statusCode: 409 });
const invalid = (message, details) =>
  new AppError({
    code: errorCodes.validation,
    message,
    statusCode: 400,
    details,
  });

export function createCompanyAccessService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function requireCompany(companyId, active = false, client) {
    const company = active
      ? await repository.findActiveCompany(companyId, client)
      : await repository.findCompany(companyId, client);
    if (!company) throw notFound('company');
    return company;
  }

  async function rolesForCompany(companyId, roleIds, client) {
    const ids = unique(roleIds);
    const roles = await repository.findRolesByIds(companyId, ids, client);
    const existing = new Set(roles.map(({ id }) => id));
    const missing = ids.filter((id) => !existing.has(id));
    if (missing.length > 0) {
      throw invalid('Some roles do not belong to the requested company.', {
        invalidRoleIds: missing,
      });
    }
    return roles;
  }

  const record = (data, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        ...data,
        metadata: { companyId: data.companyId, ...data.metadata },
      },
      client,
    );

  return {
    async listMemberships(companyId, query) {
      await requireCompany(companyId);
      const result = await repository.listMemberships(companyId, query);
      return {
        memberships: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async getMembership(companyId, membershipId) {
      await requireCompany(companyId);
      const membership = await repository.findMembership(
        companyId,
        membershipId,
      );
      if (!membership) throw notFound('company membership');
      return membership;
    },
    addMembership(companyId, { email, roleIds }, actorUserId, context) {
      return runInTransaction(
        async (client) => {
          await requireCompany(companyId, true, client);
          const user = await repository.findUserByEmail(email, client);
          if (!user || user.status !== 'ACTIVE') {
            throw invalid(
              'An active global user with the provided email is required.',
              { field: 'email' },
            );
          }
          const roles = await rolesForCompany(companyId, roleIds, client);
          const activeCount = await repository.countActiveMemberships(
            companyId,
            client,
          );
          if (
            activeCount === 0 &&
            !roles.some(({ code }) => code === 'OWNER')
          ) {
            throw conflict('The first company membership must be an owner.');
          }
          const created = await repository.createMembership(
            {
              companyId,
              userId: user.id,
              roles,
              assignedByUserId: actorUserId,
            },
            client,
          );
          await record(
            {
              companyId,
              entityType: entityTypes.companyMembership,
              entityId: created.id,
              operation: entityChangeOperations.create,
              context,
              oldValues: null,
              newValues: companyMembershipSnapshot(created),
            },
            client,
          );
          return created;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async changeMembershipStatus(
      companyId,
      membershipId,
      { status, expectedUpdatedAt },
      context,
    ) {
      const existing = await this.getMembership(companyId, membershipId);
      return runInTransaction(
        async (client) => {
          const transactional = await repository.findMembership(
            companyId,
            membershipId,
            client,
          );
          const isActiveOwner =
            transactional.status === 'ACTIVE' &&
            transactional.roles.some(({ role }) => role.code === 'OWNER');
          if (
            isActiveOwner &&
            status !== 'ACTIVE' &&
            (await repository.countActiveOwners(companyId, client)) <= 1
          ) {
            throw conflict('The company must retain an active owner.');
          }
          const updated = await repository.updateMembershipStatus(
            companyId,
            membershipId,
            new Date(expectedUpdatedAt),
            status,
            client,
          );
          if (!updated)
            throw concurrencyConflict('company membership', existing.updatedAt);
          await record(
            {
              companyId,
              entityType: entityTypes.companyMembership,
              entityId: membershipId,
              operation: entityChangeOperations.update,
              context,
              oldValues: companyMembershipSnapshot(transactional),
              newValues: companyMembershipSnapshot(updated),
              metadata: { reason: 'STATUS_CHANGE' },
            },
            client,
          );
          return updated;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async replaceMembershipRoles(
      companyId,
      membershipId,
      { roleIds, expectedUpdatedAt },
      actorUserId,
      context,
    ) {
      const existing = await this.getMembership(companyId, membershipId);
      return runInTransaction(
        async (client) => {
          const transactional = await repository.findMembership(
            companyId,
            membershipId,
            client,
          );
          const roles = await rolesForCompany(companyId, roleIds, client);
          const wasOwner = transactional.roles.some(
            ({ role }) => role.code === 'OWNER',
          );
          const remainsOwner = roles.some(({ code }) => code === 'OWNER');
          if (
            transactional.status === 'ACTIVE' &&
            wasOwner &&
            !remainsOwner &&
            (await repository.countActiveOwners(companyId, client)) <= 1
          ) {
            throw conflict('The company must retain an active owner.');
          }
          const updated = await repository.replaceMembershipRoles(
            {
              companyId,
              membershipId,
              roles,
              assignedByUserId: actorUserId,
              expectedUpdatedAt: new Date(expectedUpdatedAt),
            },
            client,
          );
          if (!updated)
            throw concurrencyConflict('company membership', existing.updatedAt);
          await record(
            {
              companyId,
              entityType: entityTypes.companyMembership,
              entityId: membershipId,
              operation: entityChangeOperations.update,
              context,
              oldValues: companyMembershipSnapshot(transactional),
              newValues: companyMembershipSnapshot(updated),
              metadata: { reason: 'ROLE_ASSIGNMENT' },
            },
            client,
          );
          return updated;
        },
        { isolationLevel: 'Serializable' },
      );
    },
    async listRoles(companyId, query) {
      await requireCompany(companyId);
      const result = await repository.listRoles(companyId, query);
      return {
        roles: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async getRole(companyId, roleId) {
      await requireCompany(companyId);
      const role = await repository.findRole(companyId, roleId);
      if (!role) throw notFound('company role');
      return role;
    },
    createRole(companyId, data, context) {
      return runInTransaction(async (client) => {
        await requireCompany(companyId, true, client);
        const code = await generateCode(client, businessCodeEntities.companyRole, {
          companyId,
        });
        const created = await repository.createRole(
          companyId,
          { ...data, code },
          client,
        );
        await record(
          {
            companyId,
            entityType: entityTypes.companyRole,
            entityId: created.id,
            operation: entityChangeOperations.create,
            context,
            oldValues: null,
            newValues: companyRoleSnapshot(created),
          },
          client,
        );
        return created;
      });
    },
    async updateRole(companyId, roleId, data, context) {
      const existing = await this.getRole(companyId, roleId);
      if (existing.isSystem)
        throw conflict('System company roles are immutable.');
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.updateRole(
          companyId,
          roleId,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated)
          throw concurrencyConflict('company role', existing.updatedAt);
        await record(
          {
            companyId,
            entityType: entityTypes.companyRole,
            entityId: roleId,
            operation: entityChangeOperations.update,
            context,
            oldValues: companyRoleSnapshot(existing),
            newValues: companyRoleSnapshot(updated),
          },
          client,
        );
        return updated;
      });
    },
    async deleteRole(companyId, roleId, expectedUpdatedAt, context) {
      const existing = await this.getRole(companyId, roleId);
      if (existing.isSystem)
        throw conflict('System company roles cannot be deleted.');
      return runInTransaction(async (client) => {
        const result = await repository.deleteRole(
          companyId,
          roleId,
          new Date(expectedUpdatedAt),
          client,
        );
        if (result.count !== 1)
          throw concurrencyConflict('company role', existing.updatedAt);
        await record(
          {
            companyId,
            entityType: entityTypes.companyRole,
            entityId: roleId,
            operation: entityChangeOperations.delete,
            context,
            oldValues: companyRoleSnapshot(existing),
            newValues: null,
          },
          client,
        );
      });
    },
    async replaceRolePermissions(
      companyId,
      roleId,
      { permissionCodes, expectedUpdatedAt },
      actorUserId,
      context,
    ) {
      const existing = await this.getRole(companyId, roleId);
      if (existing.isSystem)
        throw conflict('System company roles are immutable.');
      const codes = unique(permissionCodes);
      const malformed = codes.filter((code) => !isPermissionCode(code));
      if (malformed.length)
        throw invalid('Some permission codes are invalid.', {
          invalidPermissionCodes: malformed,
        });
      const permissions = await repository.findCompanyPermissions(codes);
      const found = new Set(permissions.map(({ code }) => code));
      const missing = codes.filter((code) => !found.has(code));
      if (missing.length)
        throw invalid('Some permissions are not company permissions.', {
          invalidPermissionCodes: missing,
        });
      return runInTransaction(async (client) => {
        const updated = await repository.replaceRolePermissions(
          {
            companyId,
            roleId,
            permissions,
            assignedByUserId: actorUserId,
            expectedUpdatedAt: new Date(expectedUpdatedAt),
          },
          client,
        );
        if (!updated)
          throw concurrencyConflict('company role', existing.updatedAt);
        await record(
          {
            companyId,
            entityType: entityTypes.companyRole,
            entityId: roleId,
            operation: entityChangeOperations.update,
            context,
            oldValues: companyRoleSnapshot(existing),
            newValues: companyRoleSnapshot(updated),
            metadata: { reason: 'PERMISSION_ASSIGNMENT' },
          },
          client,
        );
        return updated;
      });
    },
  };
}
