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
import { productUnitSnapshot } from '../entity-changes/entity-change.snapshots.js';
const invalid = (message, fields) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode: 400,
  });
export function createProductUnitsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validate(companyId, measurementUnitId, client) {
    const refs = await repository.findReferences(
      companyId,
      measurementUnitId,
      client,
    );
    if (!refs.company || refs.company.status !== 'ACTIVE')
      throw invalid('An active company is required.');
    if (!refs.measurementUnit?.isActive)
      throw invalid('The selected measurement unit must exist and be active.', [
        'measurementUnitId',
      ]);
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.productUnit,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: productUnitSnapshot(oldValue),
        newValues: productUnitSnapshot(newValue),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        productUnits: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const value = await repository.find(companyId, id);
      if (!value)
        throw new AppError({
          code: errorCodes.notFound,
          message: 'The requested product unit was not found.',
          statusCode: 404,
        });
      return value;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await validate(companyId, data.measurementUnitId, client);
        const code = await generateCode(
          client,
          businessCodeEntities.productUnit,
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
      const old = await this.get(companyId, id);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        if (changes.measurementUnitId)
          await validate(companyId, changes.measurementUnitId, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('product unit', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (data.isActive)
          await validate(companyId, old.measurementUnitId, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          { isActive: data.isActive },
          client,
        );
        if (!updated) throw concurrencyConflict('product unit', old.updatedAt);
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
