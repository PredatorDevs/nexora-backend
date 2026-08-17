import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../core/code-generation/business-code.js';
import { entityChangeOperations, entitySchemas, entityTypes } from '../entity-changes/entity-change.constants.js';
import { warehouseCategorySnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () => new AppError({
  code: errorCodes.notFound,
  message: 'The requested warehouse category was not found.',
  statusCode: 404,
});

const inactiveCompany = () => new AppError({
  code: errorCodes.validation,
  message: 'An active company is required.',
  statusCode: 400,
});

export function createWarehouseCategoriesService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record({
      schemaName: entitySchemas.companies,
      entityType: entityTypes.warehouseCategory,
      entityId: newValue?.id ?? oldValue.id,
      companyId,
      operation: oldValue ? entityChangeOperations.update : entityChangeOperations.create,
      context,
      oldValues: warehouseCategorySnapshot(oldValue),
      newValues: warehouseCategorySnapshot(newValue),
      metadata,
    }, client);

  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        warehouseCategories: result.items,
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
        if (!company || company.status !== 'ACTIVE') throw inactiveCompany();
        const code = await generateCode(
          client,
          businessCodeEntities.warehouseCategory,
          { companyId },
        );
        const created = await repository.create(
          companyId,
          { ...data, code },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const existing = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.update(companyId, id, new Date(expectedUpdatedAt), changes, client);
        if (!updated) throw concurrencyConflict('warehouse category', existing.updatedAt);
        await record(companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, { isActive, expectedUpdatedAt }, context) {
      const existing = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        const updated = await repository.update(companyId, id, new Date(expectedUpdatedAt), { isActive }, client);
        if (!updated) throw concurrencyConflict('warehouse category', existing.updatedAt);
        await record(companyId, existing, updated, context, { reason: 'STATUS_CHANGE' }, client);
        return updated;
      });
    },
  };
}
