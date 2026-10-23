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
    async listStock(companyId, query, client = prisma) {
      const where = {
        companyId, quantity: { gt: 0 },
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.lotId ? { inventoryLotId: query.lotId } : {}),
        ...(query.productId ? { inventoryLot: { productId: query.productId } } : {}),
        ...((query.warehouseId || query.branchId) ? { location: {
          ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
          ...(query.branchId ? { warehouse: { branchId: query.branchId } } : {}),
        } } : {}),
        ...(query.search ? { OR: [
          { inventoryLot: { code: { contains: query.search } } },
          { inventoryLot: { product: { internalCode: { contains: query.search } } } },
          { inventoryLot: { product: { name: { contains: query.search } } } },
          { location: { code: { contains: query.search } } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        client.inventoryLocationDetail.findMany({
          where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
          include: {
            inventoryLot: { select: {
              id: true, code: true, receivedAt: true, unitCost: true,
              stockUnit: { select: { id: true, code: true, name: true } },
              product: { select: { id: true, internalCode: true, sku: true, name: true } },
            } },
            location: { select: {
              id: true, code: true, aisle: true, rack: true, level: true, position: true,
              warehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
            } },
          },
        }),
        client.inventoryLocationDetail.count({ where }),
      ]);
      return { items, total };
    },
    async listKardex(companyId, query, client = prisma) {
      const where = {
        companyId,
        ...(query.movementType ? { movementType: query.movementType } : {}),
        ...(query.locationId ? { locationId: query.locationId } : {}),
        ...(query.lotId ? { inventoryLotId: query.lotId } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.branchId ? { warehouse: { branchId: query.branchId } } : {}),
        ...((query.dateFrom || query.dateTo) ? { movementDate: {
          ...(query.dateFrom ? { gte: query.dateFrom } : {}),
          ...(query.dateTo ? { lte: query.dateTo } : {}),
        } } : {}),
        ...(query.search ? { OR: [
          { inventoryLot: { code: { contains: query.search } } },
          { product: { internalCode: { contains: query.search } } },
          { product: { name: { contains: query.search } } },
          { reason: { contains: query.search } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        client.inventoryMovement.findMany({
          where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
          include: {
            product: { select: { id: true, internalCode: true, name: true } },
            inventoryLot: { select: { id: true, code: true, stockUnit: { select: { code: true, name: true } } } },
            warehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
            location: { select: { id: true, code: true } },
            confirmedBy: { select: { id: true, displayName: true } },
            reversals: { select: { id: true }, take: 1 },
          },
        }),
        client.inventoryMovement.count({ where }),
      ]);
      return { items, total };
    },
    async listCosts(companyId, query, client = prisma) {
      const where = {
        companyId,
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.search ? { OR: [
          { product: { internalCode: { contains: query.search } } },
          { product: { sku: { contains: query.search } } },
          { product: { name: { contains: query.search } } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        client.inventoryCostAverage.findMany({
          where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
          include: { product: { select: {
            id: true, internalCode: true, sku: true, name: true,
            saleUnit: { select: { id: true, code: true, name: true } },
          } } },
        }),
        client.inventoryCostAverage.count({ where }),
      ]);
      return { items, total };
    },
    async listLots(companyId, query, client = prisma) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.productId ? { productId: query.productId } : {}),
        ...(query.warehouseId ? { purchaseDetail: { purchase: { warehouseId: query.warehouseId } } } : {}),
        ...(query.search ? { OR: [
          { code: { contains: query.search } },
          { product: { name: { contains: query.search } } },
          { product: { internalCode: { contains: query.search } } },
          { purchaseDetail: { purchase: { code: { contains: query.search } } } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        client.inventoryLot.findMany({
          where, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
          include: lotInclude,
        }),
        client.inventoryLot.count({ where }),
      ]);
      return { items, total };
    },
    findLot(companyId, id, client = prisma) {
      return client.inventoryLot.findFirst({ where: { id, companyId }, include: lotInclude });
    },
    async lockLot(companyId, id, client = prisma) {
      await client.$queryRaw`SELECT id FROM inventory_lots WHERE id = ${id} AND company_id = ${companyId} FOR UPDATE`;
      return this.findLot(companyId, id, client);
    },
    findLocation(companyId, id, client = prisma) {
      return client.location.findFirst({
        where: { id, companyId, isActive: true },
        select: { id: true, warehouseId: true, code: true, capacity: true, capacityUnit: true },
      });
    },
    upsertLocationBalance(companyId, inventoryLotId, locationId, amount, client = prisma) {
      return client.inventoryLocationDetail.upsert({
        where: { companyId_inventoryLotId_locationId: { companyId, inventoryLotId, locationId } },
        create: { companyId, inventoryLotId, locationId, quantity: amount },
        update: { quantity: { increment: amount } },
      });
    },
    countLabelPrints(companyId, inventoryLotId, client = prisma) {
      return client.inventoryLabelPrint.count({ where: { companyId, inventoryLotId } });
    },
    createLabelPrint(data, client = prisma) {
      return client.inventoryLabelPrint.create({ data });
    },
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

const lotInclude = {
  product: { select: { id: true, internalCode: true, sku: true, name: true } },
  receivedUnit: { select: { id: true, code: true, name: true } },
  stockUnit: { select: { id: true, code: true, name: true } },
  purchaseDetail: { select: {
    id: true,
    purchase: { select: {
      id: true, code: true, warehouseId: true,
      warehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
      supplier: { select: { id: true, code: true, name: true } },
    } },
  } },
  locationDetails: {
    orderBy: { location: { code: 'asc' } },
    include: { location: { select: { id: true, code: true, aisle: true, rack: true, level: true, position: true, warehouseId: true } } },
  },
  labelPrints: { orderBy: { printedAt: 'desc' }, take: 20, select: {
    quantityPrinted: true, reprintReason: true, printedAt: true,
    printedBy: { select: { id: true, displayName: true } },
  } },
};
