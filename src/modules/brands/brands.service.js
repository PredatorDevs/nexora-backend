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
import { brandSnapshot } from '../entity-changes/entity-change.snapshots.js';

const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested brand was not found.',
    statusCode: 404,
  });
export function createBrandsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.brand,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: brandSnapshot(oldValue),
        newValues: brandSnapshot(newValue),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        brands: result.items,
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
        if (!company || company.status !== 'ACTIVE')
          throw new AppError({
            code: errorCodes.validation,
            message: 'An active company is required.',
            statusCode: 400,
          });
        const code = await generateCode(client, businessCodeEntities.brand, {
          companyId,
        });
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
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('brand', existing.updatedAt);
        await record(companyId, existing, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, data, context) {
      const existing = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          { isActive: data.isActive },
          client,
        );
        if (!updated) throw concurrencyConflict('brand', existing.updatedAt);
        await record(
          companyId,
          existing,
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
