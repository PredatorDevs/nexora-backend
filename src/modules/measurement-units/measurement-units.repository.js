const select = {
  id: true,
  name: true,
  pluralName: true,
  symbol: true,
  mhCode: true,
  comments: true,
  isActive: true,
};

export function createMeasurementUnitsRepository(prisma) {
  return {
    async list({
      page,
      pageSize,
      search,
      activeOnly,
      fiscalOnly,
      sortBy,
      sortOrder,
    }) {
      const where = {
        ...(activeOnly ? { isActive: true } : {}),
        ...(fiscalOnly ? { mhCode: { not: null } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { pluralName: { contains: search } },
                { symbol: { contains: search } },
                { mhCode: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.measurementUnit.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.measurementUnit.count({ where }),
      ]);
      return { items, total };
    },
  };
}
