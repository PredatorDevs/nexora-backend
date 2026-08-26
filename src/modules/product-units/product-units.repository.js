const select = {
  id: true,
  companyId: true,
  measurementUnitId: true,
  code: true,
  name: true,
  type: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  measurementUnit: {
    select: {
      id: true,
      name: true,
      pluralName: true,
      symbol: true,
      mhCode: true,
      isActive: true,
    },
  },
};
export function createProductUnitsRepository(prisma) {
  return {
    async list(
      companyId,
      { page, pageSize, search, type, isActive, sortBy, sortOrder },
    ) {
      const where = {
        companyId,
        ...(type ? { type } : {}),
        ...(isActive === undefined ? {} : { isActive }),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { name: { contains: search } },
                { measurementUnit: { name: { contains: search } } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.productUnit.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.productUnit.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.productUnit.findFirst({ where: { id, companyId }, select });
    },
    async findReferences(companyId, measurementUnitId, client = prisma) {
      const [company, measurementUnit] = await Promise.all([
        client.company.findUnique({
          where: { id: companyId },
          select: { id: true, status: true },
        }),
        client.measurementUnit.findUnique({
          where: { id: measurementUnitId },
          select: { id: true, isActive: true },
        }),
      ]);
      return { company, measurementUnit };
    },
    create(companyId, data, client = prisma) {
      return client.productUnit.create({
        data: { companyId, ...data },
        select,
      });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.productUnit.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
