const select = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export function createWarehouseCategoriesRepository(prisma) {
  return {
    async list(companyId, { page, pageSize, search, isActive, sortBy, sortOrder }) {
      const where = {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(search
          ? { OR: [{ code: { contains: search } }, { name: { contains: search } }] }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.warehouseCategory.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.warehouseCategory.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.warehouseCategory.findFirst({ where: { id, companyId }, select });
    },
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    },
    create(companyId, data, client = prisma) {
      return client.warehouseCategory.create({ data: { companyId, ...data }, select });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.warehouseCategory.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
