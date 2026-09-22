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
export function createExpenseTypesRepository(prisma) {
  return {
    async list(companyId, query) {
      const where = {
        companyId,
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
        ...(query.search
          ? {
              OR: [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.expenseType.findMany({
          where,
          select,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy: { [query.sortBy]: query.sortOrder },
        }),
        prisma.expenseType.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.expenseType.findFirst({ where: { id, companyId }, select });
    },
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { status: true },
      });
    },
    create(companyId, data, client = prisma) {
      return client.expenseType.create({
        data: { companyId, ...data },
        select,
      });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.expenseType.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
