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
          'At least one purchase request must be linked before receiving the quotation.',
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
          'Every quotation line must be fully allocated to purchase request lines before receiving the quotation.',
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
          'Purchase requests can only be linked to draft quotations.',
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
            throw invalid('The quotation line does not belong to this quotation.', [
              `links.${index}.purchaseQuotationDetailId`,
            ]);
          if (!requestDetail)
            throw invalid('The purchase request line was not found.', [
              `links.${index}.purchaseRequestDetailId`,
            ]);
          if (!['APPROVED', 'IN_QUOTATION'].includes(requestDetail.purchaseRequest.status))
            throw invalid('Only approved purchase requests can be quoted.', [
              `links.${index}.purchaseRequestDetailId`,
            ]);
          if (
            quotationDetail.productId !== requestDetail.productId ||
            quotationDetail.productUnitId !== requestDetail.productUnitId
          )
            throw invalid(
              'The quotation line and purchase request line must have the same product and unit.',
              [`links.${index}.purchaseRequestDetailId`],
            );
          const key = `${quotationDetail.id}:${requestDetail.id}`;
          if (seen.has(key))
            throw invalid('A request line cannot be repeated for the same quotation line.', [
              `links.${index}`,
            ]);
          seen.add(key);
          const quantity = d(link.quantity);
          if (quantity.greaterThan(d(requestDetail.quantity)))
            throw invalid(
              'The linked quantity cannot exceed the requested quantity.',
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
                'Every quotation line must be linked for its full quoted quantity.',
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
