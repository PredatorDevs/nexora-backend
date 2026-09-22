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
import { expenseTypeSnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested expense type was not found.',
    statusCode: 404,
  });
export function createExpenseTypesService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.expenseType,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: expenseTypeSnapshot(oldValue),
        newValues: expenseTypeSnapshot(newValue),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        expenseTypes: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const value = await repository.find(companyId, id);
      if (!value) throw notFound();
      return value;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        const company = await repository.findCompany(companyId, client);
        if (company?.status !== 'ACTIVE')
          throw new AppError({
            code: errorCodes.validation,
            message: 'An active company is required.',
            statusCode: 400,
          });
        const created = await repository.create(
          companyId,
          {
            ...data,
            description: data.description || null,
            code: await generateCode(client, businessCodeEntities.expenseType, {
              companyId,
            }),
          },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          {
            ...changes,
            ...(changes.description !== undefined
              ? { description: changes.description || null }
              : {}),
          },
          client,
        );
        if (!updated) throw concurrencyConflict('expense type', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          { isActive: data.isActive },
          client,
        );
        if (!updated) throw concurrencyConflict('expense type', old.updatedAt);
        await record(
          companyId,
          old,
          updated,
          context,
          { reason: 'STATUS_CHANGE' },
          client,
        );
        return updated;
      });
    },
  };
}
