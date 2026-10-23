const purchaseInclude = {
  supplier: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  details: {
    where: { inventoryLot: null },
    orderBy: { lineNumber: 'asc' },
    include: {
      product: { select: {
        id: true, internalCode: true, name: true, purchaseUnitId: true,
        saleUnitId: true, purchaseToSaleFactor: true,
        saleUnit: { select: { id: true, code: true, name: true } },
      } },
      productUnit: { select: { id: true, code: true, name: true } },
    },
  },
  retaceos: {
    where: { status: 'CLOSED' }, orderBy: { closedAt: 'desc' }, take: 1,
    select: {
      id: true, code: true, status: true, closedAt: true,
      details: { select: { purchaseDetailId: true, totalCost: true, unitCost: true } },
    },
  },
};

export function createInventoryRepository(prisma) {
  return {
    eligibleReceipts(companyId, query = {}, client = prisma) {
      return client.purchase.findMany({
        where: {
          companyId, status: { in: ['VERIFIED', 'CLOSED'] },
          details: { some: { inventoryLot: null } },
          ...(query.search ? { OR: [
            { code: { contains: query.search } },
            { supplierInvoiceNumber: { contains: query.search } },
            { supplier: { name: { contains: query.search } } },
          ] } : {}),
        },
        include: purchaseInclude,
        orderBy: [{ purchaseDate: 'asc' }, { id: 'asc' }],
      });
    },
    findReceipt(companyId, purchaseId, client = prisma) {
      return client.purchase.findFirst({
        where: { id: purchaseId, companyId }, include: purchaseInclude,
      });
    },
    createLot(data, client = prisma) {
      return client.inventoryLot.create({ data });
    },
    createMovement(data, client = prisma) {
      return client.inventoryMovement.create({ data });
    },
    async lockCostAverage(companyId, productId, client = prisma) {
      await client.inventoryCostAverage.upsert({
        where: { companyId_productId: { companyId, productId } },
        create: { companyId, productId }, update: {},
      });
      const rows = await client.$queryRaw`
        SELECT quantity_on_hand AS quantityOnHand,
               inventory_value AS inventoryValue,
               average_unit_cost AS averageUnitCost
        FROM inventory_cost_averages
        WHERE company_id = ${companyId} AND product_id = ${productId}
        FOR UPDATE
      `;
      return rows[0];
    },
    updateCostAverage(companyId, productId, data, client = prisma) {
      return client.inventoryCostAverage.update({
        where: { companyId_productId: { companyId, productId } }, data,
      });
    },
  };
}
