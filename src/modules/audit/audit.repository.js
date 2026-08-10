const auditSelect = {
  id: true,
  actorUserId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  result: true,
  requestId: true,
  ipAddress: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
};

export function createAuditRepository(prisma) {
  return {
    create(data) {
      return prisma.auditLog.create({ data, select: auditSelect });
    },
    async list({ page, pageSize, action, actorUserId, resourceType, result }) {
      const where = {
        ...(action ? { action } : {}),
        ...(actorUserId ? { actorUserId } : {}),
        ...(resourceType ? { resourceType } : {}),
        ...(result ? { result } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          select: auditSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);
      return { items, total };
    },
  };
}
