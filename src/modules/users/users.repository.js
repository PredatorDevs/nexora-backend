const userSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  securityVersion: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: { select: { id: true, code: true, name: true } },
      assignedAt: true,
    },
  },
};
export function createUsersRepository(prisma) {
  return {
    async list({ page, pageSize, search, sortBy, sortOrder }) {
      const where = search
        ? {
            OR: [
              { email: { contains: search } },
              { displayName: { contains: search } },
            ],
          }
        : {};
      const [items, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: userSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.user.count({ where }),
      ]);
      return { items, total };
    },
    findById(id, client = prisma) {
      return client.user.findUnique({ where: { id }, select: userSelect });
    },
    create(data, client = prisma) {
      return client.user.create({ data, select: userSelect });
    },
    async update(id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.user.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.findById(id, client) : null;
    },
    async changeStatus(
      id,
      status,
      expectedUpdatedAt,
      protectedRoleCode,
      client = prisma,
    ) {
      if (status === 'INACTIVE') {
        const hasProtectedRole =
          (await client.userRole.count({
            where: { userId: id, role: { code: protectedRoleCode } },
          })) > 0;
        if (
          hasProtectedRole &&
          (await client.user.count({
            where: {
              status: 'ACTIVE',
              roles: { some: { role: { code: protectedRoleCode } } },
            },
          })) <= 1
        )
          return { conflict: 'LAST_SUPER_ADMIN' };
      }
      const result = await client.user.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: {
          status,
          ...(status === 'INACTIVE'
            ? { securityVersion: { increment: 1 } }
            : {}),
        },
      });
      if (result.count !== 1) return null;
      if (status === 'INACTIVE') {
        await client.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokedReason: 'USER_INACTIVE',
          },
        });
      }
      return client.user.findUnique({
        where: { id },
        select: userSelect,
      });
    },
    async hasRoleCode(userId, roleCode) {
      return (
        (await prisma.userRole.count({
          where: { userId, role: { code: roleCode } },
        })) > 0
      );
    },
    countActiveUsersWithRoleCode(roleCode) {
      return prisma.user.count({
        where: {
          status: 'ACTIVE',
          roles: { some: { role: { code: roleCode } } },
        },
      });
    },
    async resetPassword(
      id,
      { passwordHash, mustChangePassword, expectedUpdatedAt },
      client = prisma,
    ) {
      const result = await client.user.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: {
          passwordHash,
          mustChangePassword,
          securityVersion: { increment: 1 },
        },
      });
      if (result.count !== 1) return null;
      await client.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokedReason: 'ADMIN_PASSWORD_RESET',
        },
      });
      return client.user.findUnique({
        where: { id },
        select: userSelect,
      });
    },
  };
}
