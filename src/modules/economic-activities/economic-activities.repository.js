const select = {
  id: true,
  code: true,
  name: true,
  isActive: true,
};

export function createEconomicActivitiesRepository(prisma) {
  return {
    async list({ page, pageSize, search, activeOnly, sortBy, sortOrder }) {
      const where = {
        ...(activeOnly ? { isActive: true } : {}),
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
        prisma.economicActivity.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.economicActivity.count({ where }),
      ]);
      return { items, total };
    },
  };
}
