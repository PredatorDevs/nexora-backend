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
import { productCategorySnapshot } from '../entity-changes/entity-change.snapshots.js';
const invalid = (message, fields) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode: 400,
  });
const key = (name) =>
  name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
export function createProductCategoriesService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validateParent(companyId, parentId, ownId, client) {
    if (!parentId) return null;
    if (parentId === ownId)
      throw invalid('A category cannot be its own parent.', [
        'parentCategoryId',
      ]);
    const p = await repository.find(companyId, parentId, client);
    if (!p || !p.isActive)
      throw invalid(
        'The parent category must exist and be active in this company.',
        ['parentCategoryId'],
      );
    if (p.parentCategoryId)
      throw invalid('Only one subcategory level is supported.', [
        'parentCategoryId',
      ]);
    return p;
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.productCategory,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: productCategorySnapshot(oldValue),
        newValues: productCategorySnapshot(newValue),
        metadata,
      },
      client,
    );
  return {
    async list(companyId, query) {
      const x = await repository.list(companyId, query);
      return {
        productCategories: x.items,
        pagination: paginationMeta({ ...query, total: x.total }),
      };
    },
    async get(companyId, id) {
      const x = await repository.find(companyId, id);
      if (!x)
        throw new AppError({
          code: errorCodes.notFound,
          message: 'The requested product category was not found.',
          statusCode: 404,
        });
      return x;
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        const company = await repository.findCompany(companyId, client);
        if (!company || company.status !== 'ACTIVE')
          throw invalid('An active company is required.');
        const p = await validateParent(
          companyId,
          data.parentCategoryId,
          null,
          client,
        );
        const code = await generateCode(
          client,
          businessCodeEntities.productCategory,
          { companyId },
        );
        const created = await repository.create(
          companyId,
          {
            ...data,
            parentCategoryId: p?.id ?? null,
            parentScopeId: p?.id ?? 0,
            nameKey: key(data.name),
            code,
          },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await this.get(companyId, id),
        { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const parentId = Object.hasOwn(changes, 'parentCategoryId')
          ? changes.parentCategoryId
          : old.parentCategoryId;
        const p = await validateParent(companyId, parentId, id, client);
        if (old._count.children && p)
          throw invalid(
            'A category with children cannot become a subcategory.',
            ['parentCategoryId'],
          );
        const updated = await repository.update(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          {
            ...changes,
            parentCategoryId: p?.id ?? null,
            parentScopeId: p?.id ?? 0,
            ...(changes.name ? { nameKey: key(changes.name) } : {}),
          },
          client,
        );
        if (!updated)
          throw concurrencyConflict('product category', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    async changeStatus(companyId, id, data, context) {
      const old = await this.get(companyId, id);
      return runInTransaction(async (client) => {
        if (
          !data.isActive &&
          (await repository.countActiveChildren(companyId, id, client))
        )
          throw invalid('Deactivate active subcategories first.');
        if (data.isActive)
          await validateParent(companyId, old.parentCategoryId, id, client);
        const updated = await repository.update(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          { isActive: data.isActive },
          client,
        );
        if (!updated)
          throw concurrencyConflict('product category', old.updatedAt);
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
