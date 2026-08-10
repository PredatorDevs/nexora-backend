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
    findById(id) {
      return prisma.user.findUnique({ where: { id }, select: userSelect });
    },
    create(data) {
      return prisma.user.create({ data, select: userSelect });
    },
    async update(id, expectedUpdatedAt, data) {
      const result = await prisma.user.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.findById(id) : null;
    },
    changeStatus(id, status, expectedUpdatedAt, protectedRoleCode) {
      return prisma.$transaction(
        async (transaction) => {
          if (status === 'INACTIVE') {
            const hasProtectedRole =
              (await transaction.userRole.count({
                where: { userId: id, role: { code: protectedRoleCode } },
              })) > 0;
            if (
              hasProtectedRole &&
              (await transaction.user.count({
                where: {
                  status: 'ACTIVE',
                  roles: { some: { role: { code: protectedRoleCode } } },
                },
              })) <= 1
            )
              return { conflict: 'LAST_SUPER_ADMIN' };
          }
          const result = await transaction.user.updateMany({
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
            await transaction.authSession.updateMany({
              where: { userId: id, revokedAt: null },
              data: {
                revokedAt: new Date(),
                revokedReason: 'USER_INACTIVE',
              },
            });
          }
          return transaction.user.findUnique({
            where: { id },
            select: userSelect,
          });
        },
        { isolationLevel: 'Serializable' },
      );
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
    ) {
      return prisma.$transaction(async (transaction) => {
        const result = await transaction.user.updateMany({
          where: { id, updatedAt: expectedUpdatedAt },
          data: {
            passwordHash,
            mustChangePassword,
            securityVersion: { increment: 1 },
          },
        });
        if (result.count !== 1) return null;
        await transaction.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokedReason: 'ADMIN_PASSWORD_RESET',
          },
        });
        return transaction.user.findUnique({
          where: { id },
          select: userSelect,
        });
      });
    },
  };
}
