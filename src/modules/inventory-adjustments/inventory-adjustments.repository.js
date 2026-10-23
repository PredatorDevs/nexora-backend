const user = { id: true, displayName: true };
const include = {
  warehouse: { select: { id: true, code: true, name: true, branch: { select: { id: true, code: true, name: true } } } },
  createdBy: { select: user }, approvedBy: { select: user }, cancelledBy: { select: user },
  details: { orderBy: { lineNumber: 'asc' }, include: {
    inventoryLot: { select: { id: true, code: true, productId: true, unitCost: true, stockUnit: { select: { code: true, name: true } }, product: { select: { internalCode: true, name: true } } } },
    location: { select: { id: true, code: true, warehouseId: true } },
  } },
};

export function createInventoryAdjustmentsRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.warehouseId ? { warehouseId: query.warehouseId } : {}),
        ...(query.search ? { OR: [
          { code: { contains: query.search } }, { reason: { contains: query.search } },
          { warehouse: { name: { contains: query.search } } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.inventoryAdjustment.findMany({ where, include, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { [query.sortBy]: query.sortOrder } }),
        prisma.inventoryAdjustment.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.inventoryAdjustment.findFirst({ where: { id, companyId }, include });
    },
    async lock(companyId, id, client = prisma) {
      await client.$queryRaw`SELECT id FROM inventory_adjustments WHERE id = ${id} AND company_id = ${companyId} FOR UPDATE`;
      return this.find(companyId, id, client);
    },
    findWarehouse(companyId, id, client = prisma) {
      return client.warehouse.findFirst({ where: { id, companyId, isActive: true }, select: { id: true } });
    },
    findLot(companyId, id, client = prisma) {
      return client.inventoryLot.findFirst({ where: { id, companyId }, select: { id: true, productId: true, unitCost: true, status: true } });
    },
    findLocation(companyId, id, client = prisma) {
      return client.location.findFirst({ where: { id, companyId, isActive: true }, select: { id: true, warehouseId: true } });
    },
    async create(data, client = prisma) {
      const { details, ...header } = data;
      const created = await client.inventoryAdjustment.create({ data: header, select: { id: true } });
      await client.inventoryAdjustmentDetail.createMany({ data: details.map((item) => ({ ...item, inventoryAdjustmentId: created.id })) });
      return this.find(header.companyId, created.id, client);
    },
    updateDetail(id, data, client = prisma) {
      return client.inventoryAdjustmentDetail.update({ where: { id }, data });
    },
    transition(companyId, id, expectedUpdatedAt, status, data, client = prisma) {
      return client.inventoryAdjustment.updateMany({ where: { id, companyId, status, updatedAt: expectedUpdatedAt }, data });
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
    async lockCostAverage(companyId, productId, client = prisma) {
      await client.inventoryCostAverage.upsert({ where: { companyId_productId: { companyId, productId } }, create: { companyId, productId }, update: {} });
      const rows = await client.$queryRaw`SELECT quantity_on_hand AS quantityOnHand, inventory_value AS inventoryValue, average_unit_cost AS averageUnitCost FROM inventory_cost_averages WHERE company_id = ${companyId} AND product_id = ${productId} FOR UPDATE`;
      return rows[0];
    },
    updateCostAverage(companyId, productId, data, client = prisma) {
      return client.inventoryCostAverage.update({ where: { companyId_productId: { companyId, productId } }, data });
    },
    createMovement(data, client = prisma) { return client.inventoryMovement.create({ data }); },
    async lockMovement(companyId, id, client = prisma) {
      await client.$queryRaw`SELECT id FROM inventory_movements WHERE id = ${id} AND company_id = ${companyId} FOR UPDATE`;
      return client.inventoryMovement.findFirst({
        where: { id, companyId },
        include: { reversals: { select: { id: true } }, inventoryLot: { select: { productId: true } }, location: { select: { warehouseId: true } } },
      });
    },
  };
}

