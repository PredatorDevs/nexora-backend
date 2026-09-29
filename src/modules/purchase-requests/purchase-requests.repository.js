const userSelect = { id: true, email: true, displayName: true };
const select = {
  id: true,
  uuid: true,
  companyId: true,
  code: true,
  requestType: true,
  consolidatedIntoId: true,
  consolidatedAt: true,
  consolidatedByUserId: true,
  branchId: true,
  warehouseId: true,
  requestedByUserId: true,
  requestDate: true,
  requiredDate: true,
  justification: true,
  status: true,
  notes: true,
  submittedAt: true,
  approvedAt: true,
  approvedByUserId: true,
  rejectedAt: true,
  rejectedByUserId: true,
  rejectionReason: true,
  cancelledAt: true,
  cancelledByUserId: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  company: {
    select: {
      legalName: true,
      commercialName: true,
      nit: true,
      nrc: true,
      locale: true,
      timezone: true,
    },
  },
  branch: {
    select: {
      id: true,
      code: true,
      name: true,
      addressLine: true,
      foreignAdministrativeArea: true,
      foreignLocality: true,
      phone: true,
      email: true,
      status: true,
      country: { select: { name: true } },
      department: { select: { name: true } },
      municipality: { select: { name: true } },
      district: { select: { name: true } },
    },
  },
  warehouse: { select: { id: true, code: true, name: true, isActive: true } },
  requestedBy: { select: userSelect },
  approvedBy: { select: userSelect },
  rejectedBy: { select: userSelect },
  cancelledBy: { select: userSelect },
  consolidatedBy: { select: userSelect },
  consolidatedInto: { select: { id: true, code: true } },
  sourceRequests: {
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      status: true,
      branch: { select: { code: true, name: true } },
      warehouse: { select: { code: true, name: true } },
    },
  },
  details: {
    orderBy: { lineNumber: 'asc' },
    select: {
      id: true,
      lineNumber: true,
      productId: true,
      productUnitId: true,
      quantity: true,
      description: true,
      notes: true,
      consolidationSources: {
        select: {
          quantity: true,
          sourceRequestDetail: {
            select: {
              id: true,
              lineNumber: true,
              purchaseRequest: { select: { id: true, code: true } },
            },
          },
        },
      },
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
const detailData = (details) =>
  details.map((item, index) => ({
    lineNumber: index + 1,
    productId: item.productId,
    productUnitId: item.productUnitId,
    quantity: item.quantity,
    description: item.description || null,
    notes: item.notes || null,
  }));

export function createPurchaseRequestsRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.requestType ? { requestType: query.requestType } : {}),
        ...(query.consolidationState === 'CONSOLIDATED'
          ? {
              AND: [
                {
                  OR: [
                    { requestType: 'CONSOLIDATED' },
                    { consolidatedIntoId: { not: null } },
                  ],
                },
              ],
            }
          : query.consolidationState === 'UNCONSOLIDATED'
            ? { requestType: 'STANDARD', consolidatedIntoId: null }
            : {}),
        ...(query.dateFrom || query.dateTo
          ? {
              requestDate: {
                ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                ...(query.dateTo ? { lte: query.dateTo } : {}),
              },
            }
          : {}),
        ...(query.search
          ? {
              OR: [
                { code: { contains: query.search } },
                { justification: { contains: query.search } },
                { requestedBy: { displayName: { contains: query.search } } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.purchaseRequest.findMany({
          where,
          select,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
        }),
        prisma.purchaseRequest.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.purchaseRequest.findFirst({
        where: { id, companyId },
        select,
      });
    },
    findConsolidationSources(companyId, ids, client = prisma) {
      return client.purchaseRequest.findMany({
        where: {
          companyId,
          id: { in: ids },
          requestType: 'STANDARD',
          status: 'APPROVED',
          consolidatedIntoId: null,
        },
        select: {
          id: true,
          code: true,
          details: {
            orderBy: { lineNumber: 'asc' },
            select: {
              id: true,
              productId: true,
              productUnitId: true,
              quantity: true,
              description: true,
              notes: true,
            },
          },
        },
      });
    },
    async findReferences(
      companyId,
      branchId,
      warehouseId,
      details,
      client = prisma,
    ) {
      const ids = [...new Set(details.map((item) => item.productId))];
      const [company, branch, warehouse, products] = await Promise.all([
        client.company.findUnique({
          where: { id: companyId },
          select: { status: true },
        }),
        client.branch.findFirst({
          where: { id: branchId, companyId },
          select: { id: true, status: true },
        }),
        client.warehouse.findFirst({
          where: { id: warehouseId, companyId },
          select: { id: true, branchId: true, isActive: true },
        }),
        client.product.findMany({
          where: { companyId, id: { in: ids } },
          select: {
            id: true,
            isActive: true,
            purchaseUnitId: true,
            purchaseUnit: { select: { isActive: true, type: true } },
          },
        }),
      ]);
      return { company, branch, warehouse, products };
    },
    create(companyId, data, client = prisma) {
      const { details, ...header } = data;
      return client.purchaseRequest.create({
        data: {
          companyId,
          ...header,
          details: {
            create: detailData(details),
          },
        },
        select,
      });
    },
    async createConsolidation(
      companyId,
      data,
      sourceRequests,
      userId,
      client = prisma,
    ) {
      const created = await this.create(companyId, data, client);
      const targetByProductUnit = new Map(
        created.details.map((detail) => [
          `${detail.productId}:${detail.productUnitId}`,
          detail,
        ]),
      );
      await client.purchaseRequestConsolidationDetail.createMany({
        data: sourceRequests.flatMap((request) =>
          request.details.map((detail) => ({
            companyId,
            consolidatedRequestDetailId: targetByProductUnit.get(
              `${detail.productId}:${detail.productUnitId}`,
            ).id,
            sourceRequestDetailId: detail.id,
            quantity: detail.quantity,
          })),
        ),
      });
      const sourceIds = sourceRequests.map((request) => request.id);
      const updated = await client.purchaseRequest.updateMany({
        where: {
          companyId,
          id: { in: sourceIds },
          requestType: 'STANDARD',
          status: 'APPROVED',
          consolidatedIntoId: null,
        },
        data: {
          status: 'CONSOLIDATED',
          consolidatedIntoId: created.id,
          consolidatedAt: new Date(),
          consolidatedByUserId: userId,
        },
      });
      return updated.count === sourceIds.length
        ? this.find(companyId, created.id, client)
        : null;
    },
    async replace(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const { details, ...header } = data;
      const result = await client.purchaseRequest.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt, status: 'DRAFT' },
        data: header,
      });
      if (result.count !== 1) return null;
      await client.purchaseRequestDetail.deleteMany({
        where: { companyId, purchaseRequestId: id },
      });
      await client.purchaseRequestDetail.createMany({
        data: detailData(details).map((item) => ({
          companyId,
          purchaseRequestId: id,
          ...item,
        })),
      });
      return this.find(companyId, id, client);
    },
    async transition(
      companyId,
      id,
      expectedUpdatedAt,
      fromStatuses,
      data,
      client = prisma,
    ) {
      const result = await client.purchaseRequest.updateMany({
        where: {
          id,
          companyId,
          updatedAt: expectedUpdatedAt,
          status: { in: fromStatuses },
        },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
