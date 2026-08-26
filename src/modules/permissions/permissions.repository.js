export function createPermissionsRepository(prisma) {
  return {
    async list({ page, pageSize, search, sortBy, sortOrder }) {
      const where = {
        scope: 'PLATFORM',
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { resource: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.permission.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.permission.count({ where }),
      ]);
      return { items, total };
    },
  };
}
