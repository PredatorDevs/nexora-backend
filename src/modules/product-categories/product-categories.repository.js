const select = {
  id: true,
  companyId: true,
  parentCategoryId: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  parent: { select: { id: true, code: true, name: true, isActive: true } },
  _count: { select: { children: true } },
};
export function createProductCategoriesRepository(prisma) {
  return {
    async list(
      companyId,
      {
        page,
        pageSize,
        search,
        isActive,
        parentId,
        rootOnly,
        sortBy,
        sortOrder,
      },
    ) {
      const where = {
        companyId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(rootOnly
          ? { parentCategoryId: null }
          : parentId
            ? { parentCategoryId: parentId }
            : {}),
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
        prisma.productCategory.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.productCategory.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.productCategory.findFirst({
        where: { id, companyId },
        select,
      });
    },
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    },
    create(companyId, data, client = prisma) {
      return client.productCategory.create({
        data: { companyId, ...data },
        select,
      });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const x = await client.productCategory.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return x.count === 1 ? this.find(companyId, id, client) : null;
    },
    countActiveChildren(companyId, id, client = prisma) {
      return client.productCategory.count({
        where: { companyId, parentCategoryId: id, isActive: true },
      });
    },
  };
}
