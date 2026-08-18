const select = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  description: true,
  website: true,
  logoStorageKey: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export function createBrandsRepository(prisma) {
  return {
    async list(
      companyId,
      { page, pageSize, search, isActive, sortBy, sortOrder },
    ) {
      const where = {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { name: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.brand.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.brand.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.brand.findFirst({ where: { id, companyId }, select });
    },
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    },
    create(companyId, data, client = prisma) {
      return client.brand.create({ data: { companyId, ...data }, select });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.brand.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
