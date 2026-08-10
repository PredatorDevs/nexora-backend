const entityChangeSelect = {
  id: true,
  schemaName: true,
  entityType: true,
  entityId: true,
  operation: true,
  source: true,
  actorUserId: true,
  companyId: true,
  actorMembershipId: true,
  requestId: true,
  oldValues: true,
  newValues: true,
  changedFields: true,
  metadata: true,
  createdAt: true,
};

const entityChangeSummarySelect = {
  id: true,
  schemaName: true,
  entityType: true,
  entityId: true,
  operation: true,
  source: true,
  actorUserId: true,
  companyId: true,
  actorMembershipId: true,
  requestId: true,
  changedFields: true,
  metadata: true,
  createdAt: true,
};

export function createEntityChangeRepository(prisma) {
  return {
    create(data, client = prisma) {
      return client.entityChangeLog.create({
        data,
        select: entityChangeSelect,
      });
    },
    async list({
      page,
      pageSize,
      schemaName,
      entityType,
      entityId,
      operation,
      actorUserId,
      from,
      to,
    }) {
      const where = {
        schemaName,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(operation ? { operation } : {}),
        ...(actorUserId ? { actorUserId } : {}),
        createdAt: { gte: from, lte: to },
      };
      const [items, total] = await Promise.all([
        prisma.entityChangeLog.findMany({
          where,
          select: entityChangeSummarySelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        prisma.entityChangeLog.count({ where }),
      ]);
      return { items, total };
    },
    findById(id) {
      return prisma.entityChangeLog.findUnique({
        where: { id },
        select: entityChangeSelect,
      });
    },
  };
}
