const user = { id: true, displayName: true, email: true };
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
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.purchaseQuotation.findFirst({
        where: { id, companyId },
        select,
      });
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
  };
}
