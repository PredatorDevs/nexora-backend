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
import { purchaseQuotationSnapshot } from '../entity-changes/entity-change.snapshots.js';
const invalid = (message, fields, statusCode = 400) =>
  new AppError({
    code: errorCodes.validation,
    message,
    details: fields ? { fields } : undefined,
    statusCode,
  });
const missing = () =>
  new AppError({
    code: errorCodes.notFound,
    message: 'The requested purchase quotation was not found.',
    statusCode: 404,
  });
const d = (value) => new Prisma.Decimal(value);
const round = (value) => value.toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
function calculate(details) {
  let subtotal = d(0),
    discount = d(0),
    tax = d(0),
    total = d(0);
  const rows = details.map((item, index) => {
    const quantity = d(item.quantity),
      unitPrice = d(item.unitPrice),
      discountRate = d(item.discountRate ?? 0),
      taxRate = d(item.taxRate ?? 0);
    const grossAmount = round(quantity.mul(unitPrice));
    const discountAmount = round(grossAmount.mul(discountRate).div(100));
    const net = round(grossAmount.sub(discountAmount));
    const taxAmount = round(net.mul(taxRate).div(100));
    const lineTotal = round(net.add(taxAmount));
    subtotal = subtotal.add(grossAmount);
    discount = discount.add(discountAmount);
    tax = tax.add(taxAmount);
    total = total.add(lineTotal);
    return {
      lineNumber: index + 1,
      productId: item.productId,
      productUnitId: item.productUnitId,
      quantity,
      unitPrice,
      grossAmount,
      discountRate,
      discountAmount,
      subtotal: net,
      taxRate,
      taxAmount,
      total: lineTotal,
      deliveryDays: item.deliveryDays ?? null,
      availableQuantity:
        item.availableQuantity == null ? null : d(item.availableQuantity),
      notes: item.notes || null,
    };
  });
  return {
    details: rows,
    subtotal: round(subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(total),
  };
}
export function createPurchaseQuotationsService({
  repository,
  entityChangeService,
  runInTransaction,
  generateCode = generateBusinessCode,
}) {
  async function validate(companyId, data, client) {
    const refs = await repository.references(companyId, data, client);
    if (refs.company?.status !== 'ACTIVE')
      throw invalid('An active company is required.');
    if (!refs.supplier?.isActive)
      throw invalid('The supplier must exist and be active.', ['supplierId']);
    if (
      data.supplierContactId &&
      (!refs.contact?.isActive || refs.contact.supplierId !== data.supplierId)
    )
      throw invalid(
        'The contact must be active and belong to the selected supplier.',
        ['supplierContactId'],
      );
    if (new Date(data.validUntil) < new Date(data.quotationDate))
      throw invalid('Validity cannot be earlier than quotation date.', [
        'validUntil',
      ]);
    if (
      data.currencyCode !== refs.company.defaultCurrencyCode &&
      !data.exchangeRateDate
    )
      throw invalid('Exchange rate date is required for a foreign currency.', [
        'exchangeRateDate',
      ]);
    const products = new Map(refs.products.map((x) => [x.id, x]));
    data.details.forEach((item, index) => {
      const product = products.get(item.productId);
      if (!product?.isActive)
        throw invalid('Every quoted product must be active.', [
          `details.${index}.productId`,
        ]);
      if (
        product.purchaseUnitId !== item.productUnitId ||
        !product.purchaseUnit?.isActive ||
        product.purchaseUnit.type !== 'PURCHASE'
      )
        throw invalid(
          'Each line must use the active purchase unit configured for its product.',
          [`details.${index}.productUnitId`],
        );
    });
    return refs;
  }
  const record = (companyId, oldValue, newValue, context, metadata, client) =>
    entityChangeService?.record(
      {
        schemaName: entitySchemas.companies,
        entityType: entityTypes.purchaseQuotation,
        entityId: newValue?.id ?? oldValue.id,
        companyId,
        operation: oldValue
          ? entityChangeOperations.update
          : entityChangeOperations.create,
        context,
        oldValues: purchaseQuotationSnapshot(oldValue),
        newValues: purchaseQuotationSnapshot(newValue),
        metadata,
      },
      client,
    );
  async function get(companyId, id, client) {
    const value = await repository.find(companyId, id, client);
    if (!value) throw missing();
    return value;
  }
  const normalize = (value, exchangeRate) => round(d(value).mul(exchangeRate));
  async function comparison(companyId, purchaseRequestId, client) {
    const value = await repository.findComparison(
      companyId,
      purchaseRequestId,
      client,
    );
    if (!value)
      throw new AppError({
        code: errorCodes.notFound,
        message: 'The requested purchase request was not found.',
        statusCode: 404,
      });
    return {
      ...value,
      links: value.links.map((link) => {
        const quotation = link.purchaseQuotation;
        const exchangeRate = d(quotation.exchangeRate);
        return {
          ...link,
          purchaseQuotation: {
            ...quotation,
            normalizedSubtotal: normalize(quotation.subtotal, exchangeRate),
            normalizedDiscount: normalize(quotation.discount, exchangeRate),
            normalizedTax: normalize(quotation.tax, exchangeRate),
            normalizedExpenseTotal: normalize(
              quotation.expenseTotal,
              exchangeRate,
            ),
            normalizedGrandTotal: normalize(
              quotation.grandTotal,
              exchangeRate,
            ),
          },
          details: link.details.map((item) => ({
            ...item,
            normalizedUnitPrice: normalize(
              item.quotationDetail.unitPrice,
              exchangeRate,
            ),
            normalizedLineTotal: normalize(
              item.quotationDetail.total,
              exchangeRate,
            ),
          })),
        };
      }),
    };
  }
  async function transition(companyId, id, body, context, rule) {
    const old = await get(companyId, id);
    if (!rule.from.includes(old.status))
      throw invalid(
        `A quotation in status ${old.status} cannot be ${rule.verb}.`,
        ['status'],
        409,
      );
    if (rule.expired && new Date(old.validUntil) > new Date())
      throw invalid(
        'Only an expired quotation can be marked as expired.',
        ['validUntil'],
        409,
      );
    if (rule.requireLinks) {
      if (!old.requestLinks?.length)
        throw invalid(
          'Debes vincular al menos una solicitud de compra antes de marcar la cotización como recibida.',
          ['requestLinks'],
          409,
        );
      const linkedByDetail = new Map();
      old.requestLinks.forEach((link) =>
        link.details.forEach((item) =>
          linkedByDetail.set(
            item.purchaseQuotationDetailId,
            (linkedByDetail.get(item.purchaseQuotationDetailId) ?? d(0)).add(
              item.quantity,
            ),
          ),
        ),
      );
      if (
        old.details.some(
          (item) =>
            !linkedByDetail.get(item.id)?.equals(d(item.quantity)),
        )
      )
        throw invalid(
          'Todas las líneas de la cotización deben estar vinculadas por su cantidad completa antes de marcarla como recibida.',
          ['requestLinks'],
          409,
        );
    }
    return runInTransaction(async (client) => {
      const updated = await repository.transition(
        companyId,
        id,
        new Date(body.expectedUpdatedAt),
        rule.from,
        rule.data(body, context.actorUserId),
        client,
      );
      if (!updated)
        throw concurrencyConflict('purchase quotation', old.updatedAt);
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
        purchaseQuotations: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    get,
    comparison,
    create(companyId, data, context) {
      return runInTransaction(async (client) => {
        const refs = await validate(companyId, data, client);
        const calculated = calculate(data.details);
        const created = await repository.create(
          companyId,
          {
            ...data,
            supplierContactId: data.supplierContactId ?? null,
            supplierQuotationNumber: data.supplierQuotationNumber || null,
            quotationDate: new Date(data.quotationDate),
            validUntil: new Date(data.validUntil),
            exchangeRate:
              data.currencyCode === refs.company.defaultCurrencyCode
                ? d(1)
                : d(data.exchangeRate),
            exchangeRateDate:
              data.currencyCode === refs.company.defaultCurrencyCode
                ? null
                : new Date(data.exchangeRateDate),
            paymentTerms: data.paymentTerms || null,
            deliveryDays: data.deliveryDays ?? null,
            notes: data.notes || null,
            ...calculated,
            code: await generateCode(
              client,
              businessCodeEntities.purchaseQuotation,
              { companyId },
            ),
            registeredByUserId: context.actorUserId,
          },
          client,
        );
        await record(companyId, null, created, context, null, client);
        return created;
      });
    },
    async update(companyId, id, data, context) {
      const old = await get(companyId, id);
      if (old.status !== 'DRAFT')
        throw invalid('Only draft quotations can be edited.', ['status'], 409);
      if (old.requestLinks?.length)
        throw invalid(
          'Remove the linked purchase requests before editing quotation lines.',
          ['requestLinks'],
          409,
        );
      const { expectedUpdatedAt, ...changes } = data;
      return runInTransaction(async (client) => {
        const refs = await validate(companyId, changes, client);
        const calculated = calculate(changes.details);
        const updated = await repository.replace(
          companyId,
          id,
          new Date(expectedUpdatedAt),
          {
            ...changes,
            supplierContactId: changes.supplierContactId ?? null,
            supplierQuotationNumber: changes.supplierQuotationNumber || null,
            quotationDate: new Date(changes.quotationDate),
            validUntil: new Date(changes.validUntil),
            exchangeRate:
              changes.currencyCode === refs.company.defaultCurrencyCode
                ? d(1)
                : d(changes.exchangeRate),
            exchangeRateDate:
              changes.currencyCode === refs.company.defaultCurrencyCode
                ? null
                : new Date(changes.exchangeRateDate),
            paymentTerms: changes.paymentTerms || null,
            deliveryDays: changes.deliveryDays ?? null,
            notes: changes.notes || null,
            ...calculated,
          },
          client,
        );
        if (!updated)
          throw concurrencyConflict('purchase quotation', old.updatedAt);
        await record(companyId, old, updated, context, null, client);
        return updated;
      });
    },
    async replaceRequestLinks(companyId, id, data, context) {
      const old = await get(companyId, id);
      if (old.status !== 'DRAFT')
        throw invalid(
          'Las solicitudes de compra solo pueden vincularse a cotizaciones en borrador.',
          ['status'],
          409,
        );
      return runInTransaction(async (client) => {
        const refs = await repository.findLinkReferences(
          companyId,
          id,
          data.links,
          client,
        );
        if (!refs.quotation) throw missing();
        const quotationDetails = new Map(
          refs.quotation.details.map((item) => [item.id, item]),
        );
        const requestDetails = new Map(
          refs.requestDetails.map((item) => [item.id, item]),
        );
        const seen = new Set();
        const allocatedByQuotationDetail = new Map();
        data.links.forEach((link, index) => {
          const quotationDetail = quotationDetails.get(
            link.purchaseQuotationDetailId,
          );
          const requestDetail = requestDetails.get(link.purchaseRequestDetailId);
          if (!quotationDetail)
            throw invalid('La línea seleccionada no pertenece a esta cotización.', [
              `links.${index}.purchaseQuotationDetailId`,
            ]);
          if (!requestDetail)
            throw invalid('No se encontró la línea de solicitud de compra seleccionada.', [
              `links.${index}.purchaseRequestDetailId`,
            ]);
          if (!['APPROVED', 'IN_QUOTATION'].includes(requestDetail.purchaseRequest.status))
            throw invalid('Solo pueden cotizarse solicitudes de compra aprobadas.', [
              `links.${index}.purchaseRequestDetailId`,
            ]);
          if (
            quotationDetail.productId !== requestDetail.productId ||
            quotationDetail.productUnitId !== requestDetail.productUnitId
          )
            throw invalid(
              'La línea cotizada y la línea solicitada deben tener el mismo producto y unidad.',
              [`links.${index}.purchaseRequestDetailId`],
            );
          const key = `${quotationDetail.id}:${requestDetail.id}`;
          if (seen.has(key))
            throw invalid('Una línea de solicitud no puede repetirse para la misma línea cotizada.', [
              `links.${index}`,
            ]);
          seen.add(key);
          const quantity = d(link.quantity);
          if (quantity.greaterThan(d(requestDetail.quantity)))
            throw invalid(
              'La cantidad vinculada no puede superar la cantidad solicitada.',
              [`links.${index}.quantity`],
            );
          allocatedByQuotationDetail.set(
            quotationDetail.id,
            (allocatedByQuotationDetail.get(quotationDetail.id) ?? d(0)).add(
              quantity,
            ),
          );
        });
        if (data.links.length)
          refs.quotation.details.forEach((detail) => {
            if (
              !allocatedByQuotationDetail
                .get(detail.id)
                ?.equals(d(detail.quantity))
            )
              throw invalid(
                'Todas las líneas deben vincularse por la totalidad de su cantidad cotizada.',
                ['links'],
              );
          });
        const updated = await repository.replaceRequestLinks(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          data.links.map((link) => ({ ...link, quantity: d(link.quantity) })),
          refs.requestDetails,
          client,
        );
        if (!updated)
          throw concurrencyConflict('purchase quotation', old.updatedAt);
        await record(
          companyId,
          old,
          updated,
          context,
          { reason: 'REQUEST_LINKS_REPLACED' },
          client,
        );
        return updated;
      });
    },
    async replaceExpenses(companyId, id, data, context) {
      const old = await get(companyId, id);
      if (!['DRAFT', 'RECEIVED'].includes(old.status))
        throw invalid(
          'Expenses can only be edited before the quotation enters review.',
          ['status'],
          409,
        );
      return runInTransaction(async (client) => {
        const ids = [...new Set(data.expenses.map((x) => x.expenseTypeId))];
        const types = await repository.findExpenseTypes(companyId, ids, client);
        if (
          types.length !== ids.length ||
          types.some((expenseType) => !expenseType.isActive)
        )
          throw invalid('Every expense type must exist and be active.', [
            'expenses',
          ]);
        const updated = await repository.replaceExpenses(
          companyId,
          id,
          new Date(data.expectedUpdatedAt),
          data.expenses.map((expense) => ({
            expenseTypeId: expense.expenseTypeId,
            description: expense.description || null,
            amount: d(expense.amount),
          })),
          client,
        );
        if (!updated)
          throw concurrencyConflict('purchase quotation', old.updatedAt);
        await record(
          companyId,
          old,
          updated,
          context,
          { reason: 'EXPENSES_REPLACED' },
          client,
        );
        return updated;
      });
    },
    async selectAwards(companyId, purchaseRequestId, data, context) {
      const old = await comparison(companyId, purchaseRequestId);
      if (old.request.status !== 'IN_QUOTATION')
        throw invalid(
          'Only purchase requests in quotation can be awarded.',
          ['status'],
          409,
        );
      const candidates = new Map();
      old.links.forEach((parent) =>
        parent.details.forEach((item) =>
          candidates.set(item.id, {
            ...item,
            parent,
            quotation: parent.purchaseQuotation,
          }),
        ),
      );
      const seen = new Set();
      const byRequestDetail = new Map();
      const byQuotationDetail = new Map();
      data.awards.forEach((award, index) => {
        if (seen.has(award.purchaseQuotationRequestDetailId))
          throw invalid('An offer line cannot be awarded more than once.', [
            `awards.${index}`,
          ]);
        seen.add(award.purchaseQuotationRequestDetailId);
        const candidate = candidates.get(
          award.purchaseQuotationRequestDetailId,
        );
        if (!candidate)
          throw invalid('The selected offer does not belong to this request.', [
            `awards.${index}.purchaseQuotationRequestDetailId`,
          ]);
        if (
          !['UNDER_REVIEW', 'SELECTED', 'REJECTED'].includes(
            candidate.quotation.status,
          )
        )
          throw invalid('Every selected quotation must be under review.', [
            `awards.${index}.purchaseQuotationRequestDetailId`,
          ]);
        if (new Date(candidate.quotation.validUntil) < new Date())
          throw invalid('An expired quotation cannot be selected.', [
            `awards.${index}.purchaseQuotationRequestDetailId`,
          ]);
        const quantity = d(award.awardedQuantity);
        if (quantity.greaterThan(d(candidate.quantity)))
          throw invalid(
            'The awarded quantity cannot exceed the quantity linked to the request.',
            [`awards.${index}.awardedQuantity`],
          );
        byRequestDetail.set(
          candidate.purchaseRequestDetailId,
          (byRequestDetail.get(candidate.purchaseRequestDetailId) ?? d(0)).add(
            quantity,
          ),
        );
        byQuotationDetail.set(
          candidate.purchaseQuotationDetailId,
          (byQuotationDetail.get(candidate.purchaseQuotationDetailId) ?? d(0)).add(
            quantity,
          ),
        );
      });
      const requestDetails = new Map(
        old.request.details.map((item) => [item.id, item]),
      );
      for (const [requestDetailId, quantity] of byRequestDetail) {
        if (quantity.greaterThan(d(requestDetails.get(requestDetailId).quantity)))
          throw invalid(
            'The total awarded quantity cannot exceed the requested quantity.',
            ['awards'],
          );
      }
      const quotationDetails = new Map();
      old.links.forEach((parent) =>
        parent.purchaseQuotation.details.forEach((item) =>
          quotationDetails.set(item.id, {
            detail: item,
            otherAwarded: parent.purchaseQuotation.requestLinks
              .filter((link) => link.purchaseRequestId !== purchaseRequestId)
              .flatMap((link) => link.details)
              .filter(
                (link) => link.purchaseQuotationDetailId === item.id,
              )
              .reduce(
                (sum, link) => sum.add(link.awardedQuantity ?? 0),
                d(0),
              ),
          }),
        ),
      );
      for (const [quotationDetailId, quantity] of byQuotationDetail) {
        const { detail, otherAwarded } = quotationDetails.get(quotationDetailId);
        const limit = d(detail.availableQuantity ?? detail.quantity);
        if (otherAwarded.add(quantity).greaterThan(limit))
          throw invalid(
            'The awarded quantity exceeds the supplier available quantity.',
            ['awards'],
          );
      }
      return runInTransaction(async (client) => {
        const updated = await repository.applyDecision(
          companyId,
          purchaseRequestId,
          new Date(data.expectedUpdatedAt),
          data.awards.map((award) => ({
            ...award,
            awardedQuantity: d(award.awardedQuantity),
          })),
          data.reason,
          context.actorUserId,
          client,
        );
        if (!updated)
          throw concurrencyConflict('purchase request', old.request.updatedAt);
        const oldById = new Map(
          old.links.map((link) => [link.purchaseQuotation.id, link.purchaseQuotation]),
        );
        for (const link of updated.links)
          await record(
            companyId,
            oldById.get(link.purchaseQuotation.id),
            link.purchaseQuotation,
            context,
            {
              reason: 'COMPARISON_DECISION',
              purchaseRequestId,
            },
            client,
          );
        return comparison(companyId, purchaseRequestId, client);
      });
    },
    receive: (companyId, id, body, context) =>
      transition(companyId, id, body, context, {
        from: ['DRAFT'],
        verb: 'received',
        reason: 'RECEIVED',
        requireLinks: true,
        data: () => ({ status: 'RECEIVED', receivedAt: new Date() }),
      }),
    review: (companyId, id, body, context) =>
      transition(companyId, id, body, context, {
        from: ['RECEIVED'],
        verb: 'put under review',
        reason: 'UNDER_REVIEW',
        data: () => ({ status: 'UNDER_REVIEW', underReviewAt: new Date() }),
      }),
    cancel: (companyId, id, body, context) =>
      transition(companyId, id, body, context, {
        from: ['DRAFT', 'RECEIVED', 'UNDER_REVIEW'],
        verb: 'cancelled',
        reason: 'CANCELLED',
        data: (v, userId) => ({
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledByUserId: userId,
          cancellationReason: v.reason,
        }),
      }),
    expire: (companyId, id, body, context) =>
      transition(companyId, id, body, context, {
        from: ['RECEIVED', 'UNDER_REVIEW'],
        verb: 'expired',
        reason: 'EXPIRED',
        expired: true,
        data: () => ({ status: 'EXPIRED' }),
      }),
  };
}
