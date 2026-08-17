const select = {
  id: true, companyId: true, branchId: true, warehouseCategoryId: true,
  code: true, name: true, description: true, isActive: true,
  createdAt: true, updatedAt: true,
  branch: { select: { id: true, code: true, name: true, status: true } },
  warehouseCategory: { select: { id: true, code: true, name: true, isActive: true } },
};

export function createWarehousesRepository(prisma) {
  return {
    async list(companyId, { page, pageSize, search, branchId, warehouseCategoryId, isActive, sortBy, sortOrder }) {
      const where = {
        companyId,
        ...(branchId ? { branchId } : {}),
        ...(warehouseCategoryId ? { warehouseCategoryId } : {}),
        ...(isActive === undefined ? {} : { isActive }),
        ...(search ? { OR: [{ code: { contains: search } }, { name: { contains: search } }] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.warehouse.findMany({ where, select, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortBy]: sortOrder } }),
        prisma.warehouse.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.warehouse.findFirst({ where: { id, companyId }, select });
    },
    findReferences(companyId, branchId, warehouseCategoryId, client = prisma) {
      return Promise.all([
        client.company.findUnique({ where: { id: companyId }, select: { id: true, status: true } }),
        client.branch.findFirst({ where: { id: branchId, companyId }, select: { id: true, status: true } }),
        client.warehouseCategory.findFirst({ where: { id: warehouseCategoryId, companyId }, select: { id: true, isActive: true } }),
      ]).then(([company, branch, category]) => ({ company, branch, category }));
    },
    create(companyId, data, client = prisma) {
      return client.warehouse.create({ data: { companyId, ...data }, select });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.warehouse.updateMany({ where: { id, companyId, updatedAt: expectedUpdatedAt }, data });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
