const invitationSelect = {
  id: true, companyId: true, email: true, status: true, expiresAt: true,
  acceptedAt: true, revokedAt: true, createdAt: true, updatedAt: true,
  company: { select: { id: true, legalName: true, commercialName: true, status: true } },
  invitedBy: { select: { id: true, displayName: true } },
  roles: { select: { role: { select: { id: true, code: true, name: true } } } },
};
export function createCompanyInvitationsRepository(prisma) {
  return {
    async list(companyId, { page, pageSize, search, status, sortBy, sortOrder }) {
      const where = { companyId, ...(status ? { status } : {}), ...(search ? { email: { contains: search } } : {}) };
      const [items, total] = await Promise.all([
        prisma.companyInvitation.findMany({ where, select: invitationSelect, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortBy]: sortOrder } }),
        prisma.companyInvitation.count({ where }),
      ]);
      return { items, total };
    },
    findCompany: (companyId, client = prisma) => client.company.findFirst({ where: { id: companyId, status: 'ACTIVE' }, select: { id: true } }),
    findRoles: (companyId, roleIds, client = prisma) => client.companyRole.findMany({ where: { companyId, id: { in: roleIds } }, select: { id: true } }),
    revokePending: (companyId, email, now, client = prisma) => client.companyInvitation.updateMany({ where: { companyId, email, status: 'PENDING' }, data: { status: 'REVOKED', revokedAt: now } }),
    create(data, client = prisma) {
      const { roleIds, ...invitation } = data;
      return client.companyInvitation.create({ data: { ...invitation, roles: { create: roleIds.map((roleId) => ({ roleId, companyId: invitation.companyId })) } }, select: invitationSelect });
    },
    findByTokenHash: (tokenHash, client = prisma) => client.companyInvitation.findUnique({ where: { tokenHash }, select: { ...invitationSelect, tokenHash: true } }),
    revoke: (companyId, id, now, client = prisma) => client.companyInvitation.updateMany({ where: { id, companyId, status: 'PENDING' }, data: { status: 'REVOKED', revokedAt: now } }),
    findUser: (email, client = prisma) => client.user.findUnique({ where: { email }, select: { id: true, status: true } }),
    createUser: (data, client = prisma) => client.user.create({ data, select: { id: true, status: true } }),
    findMembership: (companyId, userId, client = prisma) => client.companyMembership.findUnique({ where: { companyId_userId: { companyId, userId } }, select: { id: true, status: true } }),
    createMembership: (companyId, userId, roleIds, invitedByUserId, client = prisma) => client.companyMembership.create({ data: { companyId, userId, roles: { create: roleIds.map((roleId) => ({ companyId, roleId, assignedByUserId: invitedByUserId })) } }, select: { id: true, companyId: true } }),
    accept: (id, userId, now, client = prisma) => client.companyInvitation.updateMany({ where: { id, status: 'PENDING', expiresAt: { gt: now } }, data: { status: 'ACCEPTED', acceptedByUserId: userId, acceptedAt: now } }),
  };
}
