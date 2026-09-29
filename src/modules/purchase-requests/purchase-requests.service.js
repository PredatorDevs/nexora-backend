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
import { purchaseRequestSnapshot } from '../entity-changes/entity-change.snapshots.js';
import { generatePurchaseRequestPdf } from './purchase-request-pdf.js';

const fail = (message, fields, statusCode = 400) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode,
  });
const notFound = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested purchase request was not found.',
    statusCode: 404,
  });
const normalizeDetails = (details) =>
  details.map((item) => ({
    ...item,
    quantity: new Prisma.Decimal(item.quantity),
    description: item.description || null,
    notes: item.notes || null,
  }));

export function createPurchaseRequestsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
  generatePdf = generatePurchaseRequestPdf,
}) {
  async function validate(companyId, data, client) {
    if (new Date(data.requiredDate).getTime() < Date.now())
      throw fail('The required date cannot be in the past.', ['requiredDate']);
    const refs = await repository.findReferences(
      companyId,
      data.branchId,
      data.warehouseId,
      data.details,
      client,
    );
    if (refs.company?.status !== 'ACTIVE')
      throw fail('An active company is required.');
    if (refs.branch?.status !== 'ACTIVE')
      throw fail('The selected branch must be active.', ['branchId']);
    if (!refs.warehouse?.isActive || refs.warehouse.branchId !== data.branchId)
      throw fail(
        'The selected warehouse must be active and belong to the selected branch.',
        ['warehouseId'],
      );
    const products = new Map(
      refs.products.map((product) => [product.id, product]),
    );
    data.details.forEach((detail, index) => {
      const product = products.get(detail.productId);
      if (!product?.isActive)
        throw fail('Every requested product must exist and be active.', [
          `details.${index}.productId`,
        ]);
      if (
        product.purchaseUnitId !== detail.productUnitId ||
        !product.purchaseUnit?.isActive ||
        product.purchaseUnit.type !== 'PURCHASE'
      )
        throw fail(
          'Each line must use the active purchase unit configured for its product.',
          [`details.${index}.productUnitId`],
        );
    });
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.purchaseRequest,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: purchaseRequestSnapshot(oldValue),
        newValues: purchaseRequestSnapshot(newValue),
        metadata,
      },
      client,
    );
  async function get(companyId, id, client) {
    const value = await repository.find(companyId, id, client);
    if (!value) throw notFound();
    return value;
  }
  async function transition(companyId, id, body, context, rule) {
    const old = await get(companyId, id);
    if (!rule.from.includes(old.status))
      throw fail(
        `A purchase request in status ${old.status} cannot be ${rule.verb}.`,
        ['status'],
        409,
      );
    return runInTransaction(async (client) => {
      if (rule.validate)
        await validate(
          companyId,
          {
            branchId: old.branchId,
            warehouseId: old.warehouseId,
            requiredDate: old.requiredDate,
            details: old.details,
          },
          client,
        );
      const updated = await repository.transition(
        companyId,
        id,
        new Date(body.expectedUpdatedAt),
        rule.from,
        rule.data(body, context.actorUserId),
        client,
      );
      if (!updated)
        throw concurrencyConflict('purchase request', old.updatedAt);
      await record(
        companyId,
        old,
        updated,
        context,
        { reason: rule.reason },
        client,
      );
      return updated;
    });
  }
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return {
        purchaseRequests: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    get,
    async pdf(companyId, id) {
      const value = await get(companyId, id);
      const printableStatuses = ['APPROVED', 'IN_QUOTATION', 'COMPLETED'];
      if (
        value.requestType !== 'CONSOLIDATED' ||
        !printableStatuses.includes(value.status)
      )
        throw fail(
          'El PDF solo está disponible para solicitudes consolidadas aprobadas.',
          ['status'],
          409,
        );
      return {
        buffer: await generatePdf(value),
        filename: `solicitud-${value.code}.pdf`,
      };
    },
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        await validate(companyId, data, client);
        const created = await repository.create(
          companyId,
          {
            ...data,
            requestType: 'STANDARD',
            requiredDate: new Date(data.requiredDate),
            notes: data.notes || null,
            details: normalizeDetails(data.details),
            code: await generateCode(
              client,
              businessCodeEntities.purchaseRequest,
              { companyId },
            ),
            requestedByUserId: context.actorUserId,
          },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async consolidate(companyId, data, context) {
      const sourceIds = [...new Set(data.sourceRequestIds)];
      if (sourceIds.length !== data.sourceRequestIds.length)
        throw fail('Una solicitud de origen no puede repetirse.', [
          'sourceRequestIds',
        ]);
      return runInTransaction(async (client) => {
        const sources = await repository.findConsolidationSources(
          companyId,
          sourceIds,
          client,
        );
        if (sources.length !== sourceIds.length)
          throw fail(
            'Todas las solicitudes deben ser estándar, estar aprobadas y no haber sido consolidadas previamente.',
            ['sourceRequestIds'],
            409,
          );
        const grouped = new Map();
        for (const source of sources)
          for (const detail of source.details) {
            const key = `${detail.productId}:${detail.productUnitId}`;
            const current = grouped.get(key);
            if (current) current.quantity = current.quantity.add(detail.quantity);
            else
              grouped.set(key, {
                productId: detail.productId,
                productUnitId: detail.productUnitId,
                quantity: new Prisma.Decimal(detail.quantity),
                description: null,
                notes: null,
              });
          }
        const details = [...grouped.values()];
        await validate(
          companyId,
          {
            branchId: data.branchId,
            warehouseId: data.warehouseId,
            requiredDate: data.requiredDate,
            details,
          },
          client,
        );
        const created = await repository.createConsolidation(
          companyId,
          {
            requestType: 'CONSOLIDATED',
            branchId: data.branchId,
            warehouseId: data.warehouseId,
            requiredDate: new Date(data.requiredDate),
            justification: data.justification,
            notes: data.notes || null,
            details,
            code: await generateCode(
              client,
              businessCodeEntities.purchaseRequest,
              { companyId },
            ),
            requestedByUserId: context.actorUserId,
          },
          sources,
          context.actorUserId,
          client,
        );
        if (!created)
          throw fail(
            'Las solicitudes cambiaron mientras se consolidaban. Actualiza la lista e inténtalo nuevamente.',
            ['sourceRequestIds'],
            409,
          );
        await record(
          companyId,
          null,
          created,
          context,
          { reason: 'CONSOLIDATED', sourceRequestIds: sourceIds },
          client,
        );
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await get(companyId, id);
      if (old.status !== 'DRAFT')
        throw fail(
          'Only draft purchase requests can be edited.',
          ['status'],
          409,
        );
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        await validate(companyId, changes, client);
        const updated = await repository.replace(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          {
            ...changes,
            requiredDate: new Date(changes.requiredDate),
            notes: changes.notes || null,
            details: normalizeDetails(changes.details),
          },
          client,
        );
        if (!updated)
          throw concurrencyConflict('purchase request', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    submit(companyId, id, body, context) {
      return transition(companyId, id, body, context, {
        from: ['DRAFT'],
        verb: 'submitted',
        validate: true,
        reason: 'SUBMITTED',
        data: () => ({ status: 'SUBMITTED', submittedAt: new Date() }),
      });
    },
    approve(companyId, id, body, context) {
      return transition(companyId, id, body, context, {
        from: ['SUBMITTED'],
        verb: 'approved',
        reason: 'APPROVED',
        data: (_, userId) => ({
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedByUserId: userId,
          rejectedAt: null,
          rejectedByUserId: null,
          rejectionReason: null,
        }),
      });
    },
    reject(companyId, id, body, context) {
      return transition(companyId, id, body, context, {
        from: ['SUBMITTED'],
        verb: 'rejected',
        reason: 'REJECTED',
        data: (value, userId) => ({
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedByUserId: userId,
          rejectionReason: value.reason,
        }),
      });
    },
    cancel(companyId, id, body, context) {
      return transition(companyId, id, body, context, {
        from: ['DRAFT', 'SUBMITTED', 'APPROVED'],
        verb: 'cancelled',
        reason: 'CANCELLED',
        data: (value, userId) => ({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUserId: userId,
          cancellationReason: value.reason,
        }),
      });
    },
  };
}
