import { Prisma } from '@prisma/client';
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
import { productSnapshot } from '../entity-changes/entity-change.snapshots.js';

const invalid = (message, fields) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode: 400,
  });

function normalize(data) {
  return {
    ...data,
    ...(data.sku !== undefined ? { sku: data.sku || null } : {}),
    ...(data.originalCode !== undefined
      ? { originalCode: data.originalCode || null }
      : {}),
    ...(data.purchaseToSaleFactor !== undefined
      ? { purchaseToSaleFactor: new Prisma.Decimal(data.purchaseToSaleFactor) }
      : {}),
  };
}

export function createProductsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validate(companyId, data, client) {
    const refs = await repository.findReferences(companyId, data, client);
    if (!refs.company || refs.company.status !== 'ACTIVE')
      throw invalid('An active company is required.');
    if (
      !refs.category?.isActive ||
      !refs.category.parentCategoryId ||
      !refs.category.parent?.isActive ||
      refs.category._count.children > 0
    )
      throw invalid(
        'The selected product category must be an active leaf subcategory with an active parent.',
        ['productCategoryId'],
      );
    if (data.brandId && !refs.brand?.isActive)
      throw invalid('The selected brand must exist and be active.', [
        'brandId',
      ]);
    if (!refs.purchaseUnit?.isActive || refs.purchaseUnit.type !== 'PURCHASE')
      throw invalid(
        'The selected purchase unit must be active and of type PURCHASE.',
        ['purchaseUnitId'],
      );
    if (!refs.saleUnit?.isActive || refs.saleUnit.type !== 'SALE')
      throw invalid('The selected sale unit must be active and of type SALE.', [
        'saleUnitId',
      ]);
  }

  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.product,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: productSnapshot(oldValue),
        newValues: productSnapshot(newValue),
        metadata,
      },
      client,
    );

  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        products: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async get(companyId, id) {
      const value = await repository.find(companyId, id);
      if (!value)
        throw new AppError({
          code: errorCodes.notFound,
          message: 'The requested product was not found.',
          statusCode: 404,
        });
      return value;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await validate(companyId, data, client);
        const internalCode = await generateCode(
          client,
          businessCodeEntities.product,
          { companyId },
        );
        const created = await repository.create(
          companyId,
          normalize({ ...data, internalCode }),
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      const { expectedUpdatedAt, ...rawChanges } = data;
      const changes = normalize(rawChanges);
      const effective = {
        productCategoryId: changes.productCategoryId ?? old.productCategoryId,
        brandId: changes.brandId !== undefined ? changes.brandId : old.brandId,
        purchaseUnitId: changes.purchaseUnitId ?? old.purchaseUnitId,
        saleUnitId: changes.saleUnitId ?? old.saleUnitId,
      };
      return runInTransaction(async (client) => {
        await validate(companyId, effective, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('product', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (data.isActive)
          await validate(
            companyId,
            {
              productCategoryId: old.productCategoryId,
              brandId: old.brandId,
              purchaseUnitId: old.purchaseUnitId,
              saleUnitId: old.saleUnitId,
            },
            client,
          );
        const updated = await repository.update(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          { isActive: data.isActive },
          client,
        );
        if (!updated) throw concurrencyConflict('product', old.updatedAt);
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
