const user = { id: true, displayName: true };
const include = {
  sourceWarehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
  destinationWarehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
  createdBy: { select: user }, dispatchedBy: { select: user },
  receivedBy: { select: user }, cancelledBy: { select: user },
  details: { orderBy: { lineNumber: 'asc' }, include: {
    inventoryLot: { select: { id: true, code: true, productId: true, unitCost: true, stockUnit: { select: { code: true, name: true } }, product: { select: { internalCode: true, name: true } } } },
    sourceLocation: { select: { id: true, code: true, warehouseId: true } },
    destinationLocation: { select: { id: true, code: true, warehouseId: true } },
  } },
};

export function createInventoryTransfersRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.sourceWarehouseId ? { sourceWarehouseId: query.sourceWarehouseId } : {}),
        ...(query.destinationWarehouseId ? { destinationWarehouseId: query.destinationWarehouseId } : {}),
        ...(query.search ? { OR: [
          { code: { contains: query.search } },
          { sourceWarehouse: { name: { contains: query.search } } },
          { destinationWarehouse: { name: { contains: query.search } } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.inventoryTransfer.findMany({ where, include, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { [query.sortBy]: query.sortOrder } }),
        prisma.inventoryTransfer.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.inventoryTransfer.findFirst({ where: { id, companyId }, include });
    },
    findWarehouse(companyId, id, client = prisma) {
      return client.warehouse.findFirst({ where: { id, companyId, isActive: true }, select: { id: true } });
    },
    findLocationBalance(companyId, lotId, locationId, client = prisma) {
      return client.inventoryLocationDetail.findFirst({
        where: { companyId, inventoryLotId: lotId, locationId },
        include: {
          inventoryLot: { select: { id: true, unitCost: true, status: true, productId: true } },
          location: { select: { id: true, warehouseId: true, isActive: true } },
        },
      });
    },
    findLocation(companyId, id, client = prisma) {
      return client.location.findFirst({ where: { id, companyId, isActive: true }, select: { id: true, warehouseId: true } });
    },
    async create(data, client = prisma) {
      const { details, ...header } = data;
      const created = await client.inventoryTransfer.create({ data: header, select: { id: true } });
      await client.inventoryTransferDetail.createMany({ data: details.map((item) => ({ ...item, inventoryTransferId: created.id })) });
      return this.find(header.companyId, created.id, client);
    },
    transition(companyId, id, expectedUpdatedAt, from, data, client = prisma) {
      return client.inventoryTransfer.updateMany({ where: { id, companyId, updatedAt: expectedUpdatedAt, status: { in: from } }, data });
    },
    decrementBalance(companyId, lotId, locationId, amount, client = prisma) {
      return client.inventoryLocationDetail.updateMany({
        where: { companyId, inventoryLotId: lotId, locationId, quantity: { gte: amount } },
        data: { quantity: { decrement: amount } },
      });
    },
    incrementBalance(companyId, lotId, locationId, amount, client = prisma) {
      return client.inventoryLocationDetail.upsert({
        where: { companyId_inventoryLotId_locationId: { companyId, inventoryLotId: lotId, locationId } },
        create: { companyId, inventoryLotId: lotId, locationId, quantity: amount },
        update: { quantity: { increment: amount } },
      });
    },
    createMovement(data, client = prisma) {
      return client.inventoryMovement.create({ data });
    },
  };
}
