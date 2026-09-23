const user = { id: true, displayName: true, email: true };
const withComparativeTotals = (quotation) => {
  if (!quotation) return null;
  const expenseTotal = quotation.expenses.reduce(
    (sum, expense) => sum.add(expense.amount),
    quotation.total.mul(0),
  );
  return {
    ...quotation,
    expenseTotal,
    grandTotal: quotation.total.add(expenseTotal),
  };
};
const select = {
  id: true,
  uuid: true,
  companyId: true,
  code: true,
  supplierId: true,
  supplierContactId: true,
  supplierQuotationNumber: true,
  quotationDate: true,
  validUntil: true,
  currencyCode: true,
  exchangeRate: true,
  exchangeRateDate: true,
  paymentTerms: true,
  deliveryDays: true,
  subtotal: true,
  discount: true,
  tax: true,
  total: true,
  status: true,
  notes: true,
  registeredByUserId: true,
  receivedAt: true,
  underReviewAt: true,
  cancelledAt: true,
  cancelledByUserId: true,
  cancellationReason: true,
  selectedAt: true,
  selectedByUserId: true,
  selectionReason: true,
  rejectedAt: true,
  rejectedByUserId: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  supplier: { select: { id: true, code: true, name: true, isActive: true } },
  supplierContact: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      isActive: true,
    },
  },
  registeredBy: { select: user },
  cancelledBy: { select: user },
  selectedBy: { select: user },
  rejectedBy: { select: user },
  details: {
    orderBy: { lineNumber: 'asc' },
    select: {
      id: true,
      lineNumber: true,
      productId: true,
      productUnitId: true,
      quantity: true,
      unitPrice: true,
      grossAmount: true,
      discountRate: true,
      discountAmount: true,
      subtotal: true,
      taxRate: true,
      taxAmount: true,
      total: true,
      deliveryDays: true,
      availableQuantity: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          internalCode: true,
          sku: true,
          name: true,
          isActive: true,
        },
      },
      productUnit: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          isActive: true,
          measurementUnit: { select: { name: true, symbol: true } },
        },
      },
    },
  },
  requestLinks: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      purchaseRequestId: true,
      decidedAt: true,
      decidedByUserId: true,
      decisionReason: true,
      purchaseRequest: {
        select: { id: true, code: true, status: true, requiredDate: true },
      },
      details: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          purchaseQuotationDetailId: true,
          purchaseRequestDetailId: true,
          quantity: true,
          awardedQuantity: true,
          requestDetail: {
            select: {
              lineNumber: true,
              quantity: true,
              product: { select: { internalCode: true, name: true } },
            },
          },
        },
      },
    },
  },
  expenses: {
    orderBy: { lineNumber: 'asc' },
    select: {
      id: true,
      lineNumber: true,
      expenseTypeId: true,
      description: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      expenseType: {
        select: { id: true, code: true, name: true, isActive: true },
      },
    },
  },
};
export function createPurchaseQuotationsRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.search
          ? {
              OR: [
                { code: { contains: query.search } },
                { supplierQuotationNumber: { contains: query.search } },
                { supplier: { name: { contains: query.search } } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.purchaseQuotation.findMany({
          where,
          select,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
        }),
        prisma.purchaseQuotation.count({ where }),
      ]);
      return { items: items.map(withComparativeTotals), total };
    },
    async find(companyId, id, client = prisma) {
      const quotation = await client.purchaseQuotation.findFirst({
        where: { id, companyId },
        select,
      });
      return withComparativeTotals(quotation);
    },
    async references(companyId, data, client = prisma) {
      const [company, supplier, contact, products] = await Promise.all([
        client.company.findUnique({
          where: { id: companyId },
          select: { status: true, defaultCurrencyCode: true },
        }),
        client.supplier.findFirst({
          where: { id: data.supplierId, companyId },
          select: { id: true, isActive: true },
        }),
        data.supplierContactId
          ? client.supplierContact.findFirst({
              where: { id: data.supplierContactId, companyId },
              select: { id: true, supplierId: true, isActive: true },
            })
          : null,
        client.product.findMany({
          where: {
            companyId,
            id: { in: [...new Set(data.details.map((x) => x.productId))] },
          },
          select: {
            id: true,
            isActive: true,
            purchaseUnitId: true,
            purchaseUnit: { select: { isActive: true, type: true } },
          },
        }),
      ]);
      return { company, supplier, contact, products };
    },
    create(companyId, data, client = prisma) {
      const { details, ...header } = data;
      return client.purchaseQuotation.create({
        data: { companyId, ...header, details: { create: details } },
        select,
      });
    },
    async replace(companyId, id, expected, data, client = prisma) {
      const { details, ...header } = data;
      const result = await client.purchaseQuotation.updateMany({
        where: { id, companyId, updatedAt: expected, status: 'DRAFT' },
        data: header,
      });
      if (result.count !== 1) return null;
      await client.purchaseQuotationDetail.deleteMany({
        where: { companyId, purchaseQuotationId: id },
      });
      await client.purchaseQuotationDetail.createMany({
        data: details.map((x) => ({
          companyId,
          purchaseQuotationId: id,
          ...x,
        })),
      });
      return this.find(companyId, id, client);
    },
    async transition(companyId, id, expected, from, data, client = prisma) {
      const result = await client.purchaseQuotation.updateMany({
        where: { id, companyId, updatedAt: expected, status: { in: from } },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
    async findLinkReferences(companyId, quotationId, links, client = prisma) {
      const [quotation, quotationDetails, requestDetails] = await Promise.all([
        this.find(companyId, quotationId, client),
        client.purchaseQuotationDetail.findMany({
          where: {
            companyId,
            purchaseQuotationId: quotationId,
            id: {
              in: [...new Set(links.map((x) => x.purchaseQuotationDetailId))],
            },
          },
          select: {
            id: true,
            productId: true,
            productUnitId: true,
            quantity: true,
          },
        }),
        client.purchaseRequestDetail.findMany({
          where: {
            companyId,
            id: {
              in: [...new Set(links.map((x) => x.purchaseRequestDetailId))],
            },
          },
          select: {
            id: true,
            purchaseRequestId: true,
            productId: true,
            productUnitId: true,
            quantity: true,
            purchaseRequest: { select: { status: true } },
          },
        }),
      ]);
      return { quotation, quotationDetails, requestDetails };
    },
    async replaceRequestLinks(
      companyId,
      quotationId,
      expectedUpdatedAt,
      links,
      requestDetails,
      client = prisma,
    ) {
      const claimed = await client.purchaseQuotation.updateMany({
        where: {
          id: quotationId,
          companyId,
          updatedAt: expectedUpdatedAt,
          status: 'DRAFT',
        },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      const old = await client.purchaseQuotationRequest.findMany({
        where: { companyId, purchaseQuotationId: quotationId },
        select: { purchaseRequestId: true },
      });
      await client.purchaseQuotationRequest.deleteMany({
        where: { companyId, purchaseQuotationId: quotationId },
      });
      const requestByDetail = new Map(
        requestDetails.map((x) => [x.id, x.purchaseRequestId]),
      );
      const grouped = new Map();
      for (const link of links) {
        const requestId = requestByDetail.get(link.purchaseRequestDetailId);
        if (!grouped.has(requestId)) grouped.set(requestId, []);
        grouped.get(requestId).push(link);
      }
      for (const [purchaseRequestId, details] of grouped) {
        await client.purchaseQuotationRequest.create({
          data: {
            companyId,
            purchaseQuotationId: quotationId,
            purchaseRequestId,
            details: {
              create: details.map((detail) => ({ companyId, ...detail })),
            },
          },
        });
      }
      const currentIds = [...grouped.keys()];
      await client.purchaseRequest.updateMany({
        where: {
          companyId,
          id: { in: currentIds },
          status: 'APPROVED',
        },
        data: { status: 'IN_QUOTATION' },
      });
      for (const requestId of [
        ...new Set(old.map((x) => x.purchaseRequestId)),
      ].filter((id) => !grouped.has(id))) {
        const remaining = await client.purchaseQuotationRequest.count({
          where: { companyId, purchaseRequestId: requestId },
        });
        if (remaining === 0)
          await client.purchaseRequest.updateMany({
            where: {
              companyId,
              id: requestId,
              status: 'IN_QUOTATION',
            },
            data: { status: 'APPROVED' },
          });
      }
      return this.find(companyId, quotationId, client);
    },
    findExpenseTypes(companyId, ids, client = prisma) {
      return client.expenseType.findMany({
        where: { companyId, id: { in: ids } },
        select: { id: true, isActive: true },
      });
    },
    async replaceExpenses(
      companyId,
      quotationId,
      expectedUpdatedAt,
      expenses,
      client = prisma,
    ) {
      const claimed = await client.purchaseQuotation.updateMany({
        where: {
          id: quotationId,
          companyId,
          updatedAt: expectedUpdatedAt,
          status: { in: ['DRAFT', 'RECEIVED'] },
        },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      await client.purchaseQuotationExpense.deleteMany({
        where: { companyId, purchaseQuotationId: quotationId },
      });
      if (expenses.length)
        await client.purchaseQuotationExpense.createMany({
          data: expenses.map((expense, index) => ({
            companyId,
            purchaseQuotationId: quotationId,
            lineNumber: index + 1,
            ...expense,
          })),
        });
      return this.find(companyId, quotationId, client);
    },
    async findComparison(companyId, purchaseRequestId, client = prisma) {
      const request = await client.purchaseRequest.findFirst({
        where: { id: purchaseRequestId, companyId },
        select: {
          id: true,
          uuid: true,
          code: true,
          status: true,
          requestDate: true,
          requiredDate: true,
          justification: true,
          updatedAt: true,
          company: { select: { defaultCurrencyCode: true } },
          branch: { select: { id: true, code: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
          details: {
            orderBy: { lineNumber: 'asc' },
            select: {
              id: true,
              lineNumber: true,
              productId: true,
              productUnitId: true,
              quantity: true,
              description: true,
              product: {
                select: { internalCode: true, name: true },
              },
              productUnit: {
                select: {
                  code: true,
                  name: true,
                  measurementUnit: { select: { symbol: true } },
                },
              },
            },
          },
        },
      });
      if (!request) return null;
      const links = await client.purchaseQuotationRequest.findMany({
        where: { companyId, purchaseRequestId },
        orderBy: { purchaseQuotationId: 'asc' },
        select: {
          id: true,
          purchaseQuotationId: true,
          decidedAt: true,
          decidedByUserId: true,
          decisionReason: true,
          decidedBy: { select: user },
          details: {
            orderBy: { id: 'asc' },
            select: {
              id: true,
              purchaseQuotationDetailId: true,
              purchaseRequestDetailId: true,
              quantity: true,
              awardedQuantity: true,
              quotationDetail: {
                select: {
                  lineNumber: true,
                  quantity: true,
                  unitPrice: true,
                  discountRate: true,
                  taxRate: true,
                  total: true,
                  deliveryDays: true,
                  availableQuantity: true,
                },
              },
            },
          },
          purchaseQuotation: { select },
        },
      });
      return {
        request,
        links: links.map((link) => ({
          ...link,
          purchaseQuotation: withComparativeTotals(link.purchaseQuotation),
        })),
      };
    },
    async applyDecision(
      companyId,
      purchaseRequestId,
      expectedUpdatedAt,
      awards,
      reason,
      userId,
      client = prisma,
    ) {
      const claimed = await client.purchaseRequest.updateMany({
        where: {
          id: purchaseRequestId,
          companyId,
          updatedAt: expectedUpdatedAt,
          status: 'IN_QUOTATION',
        },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      const parents = await client.purchaseQuotationRequest.findMany({
        where: { companyId, purchaseRequestId },
        select: { id: true, purchaseQuotationId: true },
      });
      const parentIds = parents.map((item) => item.id);
      await client.purchaseQuotationRequestDetail.updateMany({
        where: { companyId, purchaseQuotationRequestId: { in: parentIds } },
        data: { awardedQuantity: 0 },
      });
      for (const award of awards)
        await client.purchaseQuotationRequestDetail.updateMany({
          where: {
            id: award.purchaseQuotationRequestDetailId,
            companyId,
            purchaseQuotationRequestId: { in: parentIds },
          },
          data: { awardedQuantity: award.awardedQuantity },
        });
      await client.purchaseQuotationRequest.updateMany({
        where: { id: { in: parentIds }, companyId },
        data: {
          decidedAt: new Date(),
          decidedByUserId: userId,
          decisionReason: reason,
        },
      });
      for (const quotationId of [
        ...new Set(parents.map((item) => item.purchaseQuotationId)),
      ]) {
        const [pending, awarded] = await Promise.all([
          client.purchaseQuotationRequest.count({
            where: { companyId, purchaseQuotationId: quotationId, decidedAt: null },
          }),
          client.purchaseQuotationRequestDetail.count({
            where: {
              companyId,
              awardedQuantity: { gt: 0 },
              quotationRequest: { purchaseQuotationId: quotationId },
            },
          }),
        ]);
        const selected = awarded > 0;
        const rejected = !selected && pending === 0;
        await client.purchaseQuotation.updateMany({
          where: {
            id: quotationId,
            companyId,
            status: { in: ['UNDER_REVIEW', 'SELECTED', 'REJECTED'] },
          },
          data: selected
            ? {
                status: 'SELECTED',
                selectedAt: new Date(),
                selectedByUserId: userId,
                selectionReason: reason,
                rejectedAt: null,
                rejectedByUserId: null,
                rejectionReason: null,
              }
            : rejected
              ? {
                  status: 'REJECTED',
                  rejectedAt: new Date(),
                  rejectedByUserId: userId,
                  rejectionReason: reason,
                  selectedAt: null,
                  selectedByUserId: null,
                  selectionReason: null,
                }
              : { status: 'UNDER_REVIEW' },
        });
      }
      return this.findComparison(companyId, purchaseRequestId, client);
    },
  };
}
