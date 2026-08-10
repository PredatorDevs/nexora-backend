const roleSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  permissions: {
    select: {
      permission: {
        select: { id: true, code: true, resource: true, action: true },
      },
    },
  },
};
export function createRolesRepository(prisma) {
  return {
    async list({ page, pageSize, search, sortBy, sortOrder }) {
      const where = search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        prisma.role.findMany({
          where,
          select: roleSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.role.count({ where }),
      ]);
      return { items, total };
    },
    findById(id) {
      return prisma.role.findUnique({ where: { id }, select: roleSelect });
    },
    create(data) {
      return prisma.role.create({ data, select: roleSelect });
    },
    async update(id, expectedUpdatedAt, data) {
      const result = await prisma.role.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.findById(id) : null;
    },
    delete(id, expectedUpdatedAt) {
      return prisma.role.deleteMany({
        where: { id, updatedAt: expectedUpdatedAt },
      });
    },
  };
}
