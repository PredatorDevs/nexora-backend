import { Prisma } from '@prisma/client';
import { AppError } from '../../core/errors/app-error.js';
import { concurrencyConflict } from '../../core/errors/concurrency.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { businessCodeEntities, generateBusinessCode } from '../../core/code-generation/business-code.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { entityChangeOperations, entitySchemas, entityTypes } from '../entity-changes/entity-change.constants.js';
import { retaceoSnapshot } from '../entity-changes/entity-change.snapshots.js';

const decimal = (value) => new Prisma.Decimal(value ?? 0);
const round = (value) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
const invalid = (message, statusCode = 400, details) => new AppError({
  code: errorCodes.validation, message, statusCode, details,
});
const missing = () => new AppError({
  code: errorCodes.notFound, message: 'No se encontró el retaceo solicitado.', statusCode: 404,
});
const asDate = (value) => value ? new Date(value) : null;

export function createRetaceosService({
  repository, entityChangeService, runInTransaction, generateCode = generateBusinessCode,
}) {
  const get = async (companyId, id, client) => {
    const value = await repository.find(companyId, id, client);
    if (!value) throw missing();
    return value;
  };
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record({
      schemaName: entitySchemas.companies,
      entityType: entityTypes.retaceo,
      entityId: newValue?.id ?? oldValue.id,
      companyId,
      operation: oldValue ? entityChangeOperations.update : entityChangeOperations.create,
      context,
      oldValues: retaceoSnapshot(oldValue),
      newValues: retaceoSnapshot(newValue),
      metadata,
    }, client);
  const ensureDraft = (value) => {
    if (value.status !== 'DRAFT')
      throw invalid('Solo puede modificarse un retaceo en estado borrador.', 409);
  };
  const costData = (input, type) => {
    const isRecoverableTax = input.isRecoverableTax ?? type.isRecoverableTax;
    const isCapitalizable = input.isCapitalizable ?? type.isCapitalizable;
    if (isRecoverableTax && isCapitalizable)
      throw invalid('Un impuesto recuperable no puede formar parte del costo.');
    return {
      expenseTypeId: type.id,
      description: input.description ?? null,
      documentNumber: input.documentNumber ?? null,
      documentDate: asDate(input.documentDate),
      currencyCode: input.currencyCode,
      originalAmount: decimal(input.originalAmount),
      exchangeRate: decimal(input.exchangeRate),
      exchangeRateDate: asDate(input.exchangeRateDate),
      baseAmount: round(decimal(input.originalAmount).mul(input.exchangeRate)),
      category: input.category ?? type.landedCostCategory,
      isCapitalizable,
      isRecoverableTax,
      isCifComponent: input.isCifComponent ?? type.isCifComponent,
      allocationMethod: input.allocationMethod ?? type.defaultAllocationMethod,
    };
  };

  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return { retaceos: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    get,
    async eligiblePurchases(companyId, query) {
      const result = await repository.eligiblePurchases(companyId, query);
      return { purchases: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    async create(companyId, data, context) {
      return runInTransaction(async (client) => {
        const purchase = await repository.findPurchase(companyId, data.purchaseId, client);
        if (!purchase) throw invalid('No se encontró la compra seleccionada.', 404);
        if (!['VERIFIED', 'CLOSED'].includes(purchase.status))
          throw invalid('Solo las compras verificadas o cerradas pueden someterse a retaceo.', 409);
        if (purchase.retaceo)
          throw invalid('La compra seleccionada ya tiene un retaceo asociado.', 409);
        if (!purchase.details.length)
          throw invalid('La compra seleccionada no contiene productos recibidos.', 409);
        if (!await repository.findCountry(data.originCountryId, client))
          throw invalid('El país de origen seleccionado no existe o está inactivo.');

        const details = purchase.details.map((item) => {
          const quantity = decimal(item.quantityReceived);
          const fobTotal = round(decimal(item.subtotal));
          return {
            companyId, purchaseDetailId: item.id, productId: item.productId,
            productUnitId: item.productUnitId, lineNumber: item.lineNumber, quantity,
            fobUnitCost: round(fobTotal.div(quantity)), fobTotal,
          };
        });
        const costs = data.includeOrderExpenses
          ? purchase.purchaseOrder.expenses.map((expense, index) => ({
              companyId, expenseTypeId: expense.expenseTypeId,
              purchaseOrderExpenseId: expense.id, createdByUserId: context.actorUserId,
              lineNumber: index + 1, description: expense.description,
              currencyCode: purchase.currencyCode, originalAmount: expense.amount,
              exchangeRate: decimal(1), baseAmount: expense.amount,
              category: expense.expenseType.landedCostCategory,
              isCapitalizable: expense.isCostable && expense.expenseType.isCapitalizable
                && !expense.expenseType.isRecoverableTax,
              isRecoverableTax: expense.expenseType.isRecoverableTax,
              isCifComponent: expense.expenseType.isCifComponent,
              allocationMethod: expense.expenseType.defaultAllocationMethod,
            }))
          : [];
        const created = await repository.create({
          companyId, code: await generateCode(client, businessCodeEntities.retaceo, { companyId }),
          purchaseId: purchase.id, supplierId: purchase.supplierId,
          originCountryId: data.originCountryId, createdByUserId: context.actorUserId,
          retaceoDate: new Date(data.retaceoDate), currencyCode: purchase.currencyCode,
          exchangeRate: purchase.exchangeRate, exchangeRateDate: purchase.exchangeRateDate,
          importInvoiceNumber: data.importInvoiceNumber ?? null,
          importInvoiceDate: asDate(data.importInvoiceDate),
          importPolicyNumber: data.importPolicyNumber ?? null,
          importPolicyDate: asDate(data.importPolicyDate), notes: data.notes ?? null,
          totalFob: round(details.reduce((sum, item) => sum.add(item.fobTotal), decimal(0))),
          details, costs,
        }, client);
        await record(companyId, null, created, context, { purchaseId: purchase.id }, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await get(companyId, id);
      ensureDraft(old);
      if (!await repository.findCountry(data.originCountryId))
        throw invalid('El país de origen seleccionado no existe o está inactivo.');
      const detailIds = new Set(old.details.map((item) => item.id));
      if (data.details.some((item) => !detailIds.has(item.retaceoDetailId)))
        throw invalid('Una de las líneas modificadas no pertenece al retaceo.');
      return runInTransaction(async (client) => {
        const updated = await repository.updateDraft(companyId, id, new Date(data.expectedUpdatedAt), {
          originCountryId: data.originCountryId, retaceoDate: new Date(data.retaceoDate),
          importInvoiceNumber: data.importInvoiceNumber ?? null,
          importInvoiceDate: asDate(data.importInvoiceDate),
          importPolicyNumber: data.importPolicyNumber ?? null,
          importPolicyDate: asDate(data.importPolicyDate), notes: data.notes ?? null,
        }, data.details, client);
        if (!updated) throw concurrencyConflict('retaceo', old.updatedAt);
        await record(companyId, old, updated, context, { reason: 'UPDATE_DRAFT' }, client);
        return updated;
      });
    },
    async createCost(companyId, id, data, context) {
      const old = await get(companyId, id);
      ensureDraft(old);
      return runInTransaction(async (client) => {
        if (!await repository.claimDraft(companyId, id, new Date(data.expectedRetaceoUpdatedAt), client))
          throw concurrencyConflict('retaceo', old.updatedAt);
        const type = await repository.findExpenseType(companyId, data.expenseTypeId, client);
        if (!type) throw invalid('El tipo de gasto no existe o está inactivo.');
        const line = await repository.nextCostLine(companyId, id, client);
        const created = await repository.createCost({
          companyId, retaceoId: id, createdByUserId: context.actorUserId,
          lineNumber: (line._max.lineNumber ?? 0) + 1, ...costData(data, type),
        }, client);
        const updated = await get(companyId, id, client);
        await record(companyId, old, updated, context, { reason: 'ADD_COST', costId: created.id }, client);
        return { cost: created, retaceoUpdatedAt: updated.updatedAt };
      });
    },
    async updateCost(companyId, id, costId, data, context) {
      const old = await get(companyId, id);
      ensureDraft(old);
      if (!await repository.findCost(companyId, id, costId))
        throw invalid('No se encontró el costo solicitado.', 404);
      return runInTransaction(async (client) => {
        if (!await repository.claimDraft(companyId, id, new Date(data.expectedRetaceoUpdatedAt), client))
          throw concurrencyConflict('retaceo', old.updatedAt);
        const type = await repository.findExpenseType(companyId, data.expenseTypeId, client);
        if (!type) throw invalid('El tipo de gasto no existe o está inactivo.');
        const cost = await repository.updateCost(companyId, id, costId, costData(data, type), client);
        const updated = await get(companyId, id, client);
        await record(companyId, old, updated, context, { reason: 'UPDATE_COST', costId }, client);
        return { cost, retaceoUpdatedAt: updated.updatedAt };
      });
    },
    async deleteCost(companyId, id, costId, data, context) {
      const old = await get(companyId, id);
      ensureDraft(old);
      if (!await repository.findCost(companyId, id, costId))
        throw invalid('No se encontró el costo solicitado.', 404);
      return runInTransaction(async (client) => {
        if (!await repository.claimDraft(companyId, id, new Date(data.expectedRetaceoUpdatedAt), client))
          throw concurrencyConflict('retaceo', old.updatedAt);
        await repository.deleteCost(companyId, id, costId, client);
        const updated = await get(companyId, id, client);
        await record(companyId, old, updated, context, { reason: 'DELETE_COST', costId }, client);
        return { deletedCostId: costId, retaceoUpdatedAt: updated.updatedAt };
      });
    },
  };
}
