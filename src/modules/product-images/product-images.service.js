import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import {
  entityChangeOperations,
  entitySchemas,
  entityTypes,
} from '../entity-changes/entity-change.constants.js';
import { productImageSnapshot } from '../entity-changes/entity-change.snapshots.js';

const MAX_IMAGES = 10;
const notFound = (message) =>
  new AppError({ code: errorCodes.notFound, message, statusCode: 404 });
const invalid = (message, fields) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode: 400,
  });

export function createProductImagesService({
  repository,
  storage,
  entityChangeService,
  runInTransaction,
}) {
  const record = (
    companyId,
    oldValue,
    newValue,
    context,
    operation,
    metadata,
    client,
  ) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.productImage,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation,
        context,
        oldValues: productImageSnapshot(oldValue),
        newValues: productImageSnapshot(newValue),
        metadata,
      },
      client,
    );

  async function product(companyId, productId, client) {
    const value = await repository.findProduct(companyId, productId, client);
    if (!value) throw notFound('The requested product was not found.');
    return value;
  }

  async function image(companyId, productId, imageId) {
    const value = await repository.find(companyId, productId, imageId);
    if (!value) throw notFound('The requested product image was not found.');
    return value;
  }

  return {
    async list(companyId, productId) {
      await product(companyId, productId);
      return repository.list(companyId, productId);
    },
    async create(companyId, productId, data, context) {
      await storage.verifyImageUpload({
        companyId,
        storageKey: data.storageKey,
      });
      return runInTransaction(async (client) => {
        await product(companyId, productId, client);
        const stats = await repository.stats(companyId, productId, client);
        if (stats.count >= MAX_IMAGES)
          throw invalid(`A product can have at most ${MAX_IMAGES} images.`);
        const isPrimary = stats.count === 0 || data.isPrimary === true;
        if (isPrimary)
          await repository.clearPrimary(companyId, productId, client);
        const created = await repository.create(
          companyId,
          productId,
          {
            ...data,
            isPrimary,
            sortOrder: stats.maxSortOrder + 1,
          },
          client,
        );
        await record(
          companyId,
          null,
          created,
          context,
          entityChangeOperations.create,
          null,
          client,
        );
        return created;
      });
    },
    async update(companyId, productId, imageId, data, context) {
      const old = await image(companyId, productId, imageId);
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const updated = await repository.update(
          companyId,
          productId,
          imageId,
          new Date(expectedUpdatedAt),
          changes,
          client,
        );
        if (!updated) throw concurrencyConflict('product image', old.updatedAt);
        await record(
          companyId,
          old,
          updated,
          context,
          entityChangeOperations.update,
          null,
          client,
        );
        return updated;
      });
    },
    async setPrimary(companyId, productId, imageId, data, context) {
      const old = await image(companyId, productId, imageId);
      return runInTransaction(async (client) => {
        await repository.clearPrimary(companyId, productId, client);
        const updated = await repository.update(
          companyId,
          productId,
          imageId,
          new Date(data.expectedUpdatedAt),
          { isPrimary: true },
          client,
        );
        if (!updated) throw concurrencyConflict('product image', old.updatedAt);
        await record(
          companyId,
          old,
          updated,
          context,
          entityChangeOperations.update,
          { reason: 'SET_PRIMARY' },
          client,
        );
        return updated;
      });
    },
    async reorder(companyId, productId, imageIds, context) {
      return runInTransaction(async (client) => {
        await product(companyId, productId, client);
        const existing = await repository.list(companyId, productId, client);
        if (
          existing.length !== imageIds.length ||
          existing.some((item) => !imageIds.includes(item.id))
        )
          throw invalid(
            'The order must include every current product image exactly once.',
            ['imageIds'],
          );
        const reordered = await repository.reorder(
          companyId,
          productId,
          imageIds,
          client,
        );
        await entityChangeService?.record(
          {
            schemaName: entitySchemas.companies,
            entityType: entityTypes.product,
            entityId: productId,
            companyId,
            operation: entityChangeOperations.update,
            context,
            oldValues: { imageOrder: existing.map((item) => item.id) },
            newValues: { imageOrder: imageIds },
            metadata: { reason: 'REORDER_IMAGES' },
          },
          client,
        );
        return reordered;
      });
    },
    async remove(companyId, productId, imageId, data, context) {
      const old = await image(companyId, productId, imageId);
      await runInTransaction(async (client) => {
        const removed = await repository.remove(
          companyId,
          productId,
          imageId,
          new Date(data.expectedUpdatedAt),
          client,
        );
        if (!removed) throw concurrencyConflict('product image', old.updatedAt);
        if (old.isPrimary)
          await repository.promoteFirst(companyId, productId, client);
        await record(
          companyId,
          old,
          null,
          context,
          entityChangeOperations.delete,
          null,
          client,
        );
      });
      await storage
        .deleteObject({ companyId, storageKey: old.storageKey })
        .catch(() => undefined);
    },
  };
}
