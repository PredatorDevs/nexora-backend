const select = {
  id: true,
  familyId: true,
  userId: true,
  ipAddress: true,
  userAgent: true,
  expiresAt: true,
  lastUsedAt: true,
  revokedAt: true,
  revokedReason: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, displayName: true } },
};
export function createSessionsRepository(prisma) {
  return {
    async list({ page, pageSize, userId, activeOnly, sortBy, sortOrder }) {
      const where = {
        ...(userId ? { userId } : {}),
        ...(activeOnly
          ? { revokedAt: null, expiresAt: { gt: new Date() } }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.authSession.findMany({
          where,
          select,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.authSession.count({ where }),
      ]);
      return { items, total };
    },
    findById(id) {
      return prisma.authSession.findUnique({
        where: { id },
        select: { id: true, userId: true, revokedAt: true },
      });
    },
    async revoke(id, actorUserId) {
      await prisma.authSession.updateMany({
        where: { id, revokedAt: null },
        data: {
          revokedAt: new Date(),
          revokedReason: `ADMIN_REVOKED:${actorUserId}`,
        },
      });
      return prisma.authSession.findUnique({ where: { id }, select });
    },
  };
}
