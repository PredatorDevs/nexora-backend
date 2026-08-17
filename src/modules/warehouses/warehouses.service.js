import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../core/code-generation/business-code.js';
import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { entityChangeOperations, entitySchemas, entityTypes } from '../entity-changes/entity-change.constants.js';
import { warehouseSnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () => new AppError({
  code: errorCodes.notFound,
  message: 'The requested warehouse was not found.',
  statusCode: 404,
});
const invalid = (message, fields) => new AppError({
  code: errorCodes.validation,
  message,
  details: fields ? { fields } : undefined,
  statusCode: 400,
});

export function createWarehousesService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validateReferences(companyId, branchId, categoryId, client) {
    const { company, branch, category } = await repository.findReferences(
      companyId,
      branchId,
      categoryId,
      client,
    );
    if (!company || company.status !== 'ACTIVE')
      throw invalid('An active company is required.');
    if (!branch || branch.status !== 'ACTIVE')
      throw invalid('The selected branch must exist and be active in this company.', ['branchId']);
    if (!category || !category.isActive)
      throw invalid('The selected warehouse category must exist and be active in this company.', ['warehouseCategoryId']);
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record({
      schemaName: entitySchemas.companies,
      entityType: entityTypes.warehouse,
      entityId: newValue?.id ?? oldValue.id,
      companyId,
      operation: oldValue ? entityChangeOperations.update : entityChangeOperations.create,
      context,
      oldValues: warehouseSnapshot(oldValue),
      newValues: warehouseSnapshot(newValue),
      metadata,
    }, client);

  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        warehouses: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const warehouse = await repository.find(companyId, id);
      if (!warehouse) throw notFound();
      return warehouse;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await validateReferences(companyId, data.branchId, data.warehouseCategoryId, client);
        const code = await generateCode(client, businessCodeEntities.warehouse, { companyId });
        const created = await repository.create(companyId, { ...data, code }, client);
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const existing = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        if (changes.branchId || changes.warehouseCategoryId) {
          await validateReferences(
            companyId,
            changes.branchId ?? existing.branchId,
            changes.warehouseCategoryId ?? existing.warehouseCategoryId,
            client,
          );
        }
        const updated = await repository.update(companyId, id, new Date(expectedUpdatedAt), changes, client);
        if (!updated) throw concurrencyConflict('warehouse', existing.updatedAt);
        await record(companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, { isActive, expectedUpdatedAt }, context) {
      const existing = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (isActive) {
          await validateReferences(companyId, existing.branchId, existing.warehouseCategoryId, client);
        }
        const updated = await repository.update(companyId, id, new Date(expectedUpdatedAt), { isActive }, client);
        if (!updated) throw concurrencyConflict('warehouse', existing.updatedAt);
        await record(companyId, existing, updated, context, { reason: 'STATUS_CHANGE' }, client);
        return updated;
      });
    },
  };
}
