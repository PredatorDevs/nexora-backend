const user = { id: true, displayName: true, email: true };
const detailSelect = {
  id: true, purchaseDetailId: true, lineNumber: true, productId: true,
  productUnitId: true, quantity: true, weight: true, volume: true,
  fobUnitCost: true, fobTotal: true, allocatedCapitalizableCost: true,
  totalCost: true, unitCost: true,
  product: { select: { id: true, internalCode: true, name: true } },
  productUnit: { select: { id: true, code: true, name: true } },
};
const costSelect = {
  id: true, lineNumber: true, expenseTypeId: true, purchaseOrderExpenseId: true,
  description: true, documentNumber: true, documentDate: true, currencyCode: true,
  originalAmount: true, exchangeRate: true, exchangeRateDate: true, baseAmount: true,
  category: true, isCapitalizable: true, isRecoverableTax: true,
  isCifComponent: true, allocationMethod: true, createdAt: true, updatedAt: true,
  expenseType: { select: { id: true, code: true, name: true } },
  createdBy: { select: user },
  allocations: { orderBy: { retaceoDetailId: 'asc' }, select: {
    id: true, retaceoDetailId: true, allocationMethod: true,
    baseValue: true, totalBaseValue: true, allocationFactor: true,
    originalCost: true, allocatedCost: true, roundingAdjustment: true,
  } },
};
const select = {
  id: true, uuid: true, companyId: true, code: true, purchaseId: true,
  supplierId: true, originCountryId: true, createdByUserId: true,
  retaceoDate: true, currencyCode: true, exchangeRate: true, exchangeRateDate: true,
  importInvoiceNumber: true, importInvoiceDate: true, importPolicyNumber: true,
  importPolicyDate: true, calculationVersion: true, totalFob: true, totalCif: true,
  totalCapitalizableCosts: true, totalRecoverableTaxes: true, totalLandedCost: true,
  status: true, notes: true, calculatedAt: true, calculatedByUserId: true,
  verifiedAt: true, verifiedByUserId: true, closedAt: true, closedByUserId: true,
  cancelledAt: true, cancelledByUserId: true, cancellationReason: true,
  createdAt: true, updatedAt: true,
  purchase: { select: { id: true, code: true, status: true, purchaseDate: true } },
  supplier: { select: { id: true, code: true, name: true } },
  originCountry: { select: { id: true, abbreviation: true, name: true } },
  createdBy: { select: user }, calculatedBy: { select: user },
  verifiedBy: { select: user }, closedBy: { select: user },
  cancelledBy: { select: user },
  details: { orderBy: { lineNumber: 'asc' }, select: detailSelect },
  costs: { orderBy: { lineNumber: 'asc' }, select: costSelect },
};

export function createRetaceosRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.purchaseId ? { purchaseId: query.purchaseId } : {}),
        ...(query.search ? { OR: [
          { code: { contains: query.search } },
          { purchase: { code: { contains: query.search } } },
          { supplier: { name: { contains: query.search } } },
          { importInvoiceNumber: { contains: query.search } },
          { importPolicyNumber: { contains: query.search } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.retaceo.findMany({ where, select,
          skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder } }),
        prisma.retaceo.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.retaceo.findFirst({ where: { id, companyId }, select });
    },
    async lockPurchase(companyId, id, client = prisma) {
      await client.$queryRaw`
        SELECT id
        FROM purchases
        WHERE id = ${id} AND company_id = ${companyId}
        FOR UPDATE
      `;
    },
    async eligiblePurchases(companyId, query) {
      const where = {
        companyId,
        status: { in: ['VERIFIED', 'CLOSED'] },
        retaceos: { none: { status: { not: 'CANCELLED' } } },
        ...(query.search ? { OR: [
          { code: { contains: query.search } },
          { supplierInvoiceNumber: { contains: query.search } },
          { supplier: { name: { contains: query.search } } },
        ] } : {}),
      };
      const purchaseSelect = {
        id: true, code: true, purchaseDate: true, status: true, currencyCode: true,
        total: true, supplierInvoiceNumber: true,
        supplier: { select: { id: true, code: true, name: true } },
      };
      const [items, total] = await Promise.all([
        prisma.purchase.findMany({ where, select: purchaseSelect,
          skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder } }),
        prisma.purchase.count({ where }),
      ]);
      return { items, total };
    },
    findPurchase(companyId, id, client = prisma) {
      return client.purchase.findFirst({ where: { id, companyId }, select: {
        id: true, status: true, supplierId: true, purchaseOrderId: true,
        currencyCode: true, exchangeRate: true, exchangeRateDate: true,
        retaceos: {
          where: { status: { not: 'CANCELLED' } },
          select: { id: true, status: true },
        },
        details: { orderBy: { lineNumber: 'asc' }, select: {
          id: true, lineNumber: true, productId: true, productUnitId: true,
          quantityReceived: true, subtotal: true,
        } },
        purchaseOrder: { select: { expenses: {
          orderBy: { lineNumber: 'asc' }, select: {
            id: true, expenseTypeId: true, description: true, amount: true,
            isCostable: true, expenseType: { select: {
              landedCostCategory: true, defaultAllocationMethod: true,
              isCapitalizable: true, isRecoverableTax: true, isCifComponent: true,
            } },
          },
        } } },
      } });
    },
    findCountry(id, client = prisma) {
      return client.country.findFirst({ where: { id, isActive: true }, select: { id: true } });
    },
    findExpenseType(companyId, id, client = prisma) {
      return client.expenseType.findFirst({ where: { id, companyId, isActive: true }, select: {
        id: true, landedCostCategory: true, defaultAllocationMethod: true,
        isCapitalizable: true, isRecoverableTax: true, isCifComponent: true,
      } });
    },
    async create(data, client = prisma) {
      const { details, costs, ...header } = data;
      const created = await client.retaceo.create({ data: header, select: { id: true } });
      await client.retaceoDetail.createMany({
        data: details.map((item) => ({ ...item, retaceoId: created.id })),
      });
      if (costs.length) await client.retaceoCost.createMany({
        data: costs.map((item) => ({ ...item, retaceoId: created.id })),
      });
      return this.find(header.companyId, created.id, client);
    },
    async updateDraft(companyId, id, expectedUpdatedAt, data, details, client = prisma) {
      const result = await client.retaceo.updateMany({
        where: { id, companyId, status: 'DRAFT', updatedAt: expectedUpdatedAt }, data,
      });
      if (result.count !== 1) return null;
      for (const detail of details) await client.retaceoDetail.updateMany({
        where: { id: detail.retaceoDetailId, retaceoId: id, companyId },
        data: { weight: detail.weight ?? null, volume: detail.volume ?? null },
      });
      return this.find(companyId, id, client);
    },
    async claimDraft(companyId, id, expectedUpdatedAt, client = prisma) {
      const result = await client.retaceo.updateMany({
        where: { id, companyId, status: 'DRAFT', updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
      return result.count === 1;
    },
    nextCostLine(companyId, retaceoId, client = prisma) {
      return client.retaceoCost.aggregate({ where: { companyId, retaceoId }, _max: { lineNumber: true } });
    },
    createCost(data, client = prisma) {
      return client.retaceoCost.create({ data, select: costSelect });
    },
    findCost(companyId, retaceoId, id, client = prisma) {
      return client.retaceoCost.findFirst({ where: { id, companyId, retaceoId }, select: costSelect });
    },
    async updateCost(companyId, retaceoId, id, data, client = prisma) {
      const result = await client.retaceoCost.updateMany({ where: { id, companyId, retaceoId }, data });
      return result.count === 1 ? this.findCost(companyId, retaceoId, id, client) : null;
    },
    deleteCost(companyId, retaceoId, id, client = prisma) {
      return client.retaceoCost.deleteMany({ where: { id, companyId, retaceoId } });
    },
    async applyCalculation(companyId, id, expectedUpdatedAt, calculation, actorUserId, client = prisma) {
      const result = await client.retaceo.updateMany({
        where: { id, companyId, status: 'DRAFT', updatedAt: expectedUpdatedAt },
        data: {
          ...calculation.totals,
          status: 'CALCULATED',
          calculationVersion: { increment: 1 },
          calculatedAt: new Date(),
          calculatedByUserId: actorUserId,
        },
      });
      if (result.count !== 1) return null;
      await client.retaceoAllocation.deleteMany({
        where: { companyId, retaceoCost: { retaceoId: id } },
      });
      if (calculation.allocations.length) await client.retaceoAllocation.createMany({
        data: calculation.allocations.map((item) => ({ companyId, ...item })),
      });
      for (const detail of calculation.details) await client.retaceoDetail.updateMany({
        where: { id: detail.id, retaceoId: id, companyId },
        data: {
          allocatedCapitalizableCost: detail.allocatedCapitalizableCost,
          totalCost: detail.totalCost,
          unitCost: detail.unitCost,
        },
      });
      return this.find(companyId, id, client);
    },
    async transition(companyId, id, expectedUpdatedAt, from, data, client = prisma) {
      const result = await client.retaceo.updateMany({
        where: { id, companyId, status: { in: from }, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
