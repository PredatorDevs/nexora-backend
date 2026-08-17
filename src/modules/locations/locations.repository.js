const select = {
  id: true, companyId: true, warehouseId: true, code: true,
  aisle: true, rack: true, level: true, position: true,
  capacity: true, capacityUnit: true, notes: true, isActive: true,
  createdAt: true, updatedAt: true,
  warehouse: {
    select: {
      id: true, code: true, name: true, branchId: true, isActive: true,
      branch: { select: { id: true, code: true, name: true } },
    },
  },
};

export function createLocationsRepository(prisma) {
  return {
    async list(companyId, { page, pageSize, search, branchId, warehouseId, isActive, sortBy, sortOrder }) {
      const where = {
        companyId,
        ...(warehouseId ? { warehouseId } : {}),
        ...(branchId ? { warehouse: { branchId } } : {}),
        ...(isActive === undefined ? {} : { isActive }),
        ...(search ? {
          OR: [
            { code: { contains: search } }, { aisle: { contains: search } },
            { rack: { contains: search } }, { level: { contains: search } },
            { position: { contains: search } },
          ],
        } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.location.findMany({ where, select, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortBy]: sortOrder } }),
        prisma.location.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.location.findFirst({ where: { id, companyId }, select });
    },
    findWarehouse(companyId, warehouseId, client = prisma) {
      return client.warehouse.findFirst({
        where: { id: warehouseId, companyId },
        select: { id: true, isActive: true, company: { select: { status: true } } },
      });
    },
    create(companyId, data, client = prisma) {
      return client.location.create({ data: { companyId, ...data }, select });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.location.updateMany({ where: { id, companyId, updatedAt: expectedUpdatedAt }, data });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
