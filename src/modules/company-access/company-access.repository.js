const roleSelect = {
  id: true,
  companyId: true,
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

const membershipSelect = {
  id: true,
  companyId: true,
  userId: true,
  status: true,
  securityVersion: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, email: true, displayName: true, status: true } },
  roles: { select: { role: { select: roleSelect } } },
};

export function createCompanyAccessRepository(prisma) {
  return {
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    },
    findActiveCompany(companyId, client = prisma) {
      return client.company.findFirst({
        where: { id: companyId, status: 'ACTIVE' },
        select: { id: true },
      });
    },
    findUserByEmail(email, client = prisma) {
      return client.user.findUnique({
        where: { email },
        select: { id: true, status: true },
      });
    },
    findRolesByIds(companyId, roleIds, client = prisma) {
      return client.companyRole.findMany({
        where: { companyId, id: { in: roleIds } },
        select: { id: true, code: true },
      });
    },
    async listMemberships(
      companyId,
      { page, pageSize, search, status, sortBy, sortOrder },
    ) {
      const where = {
        companyId,
        ...(status ? { status } : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { email: { contains: search } },
                  { displayName: { contains: search } },
                ],
              },
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.companyMembership.findMany({
          where,
          select: membershipSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.companyMembership.count({ where }),
      ]);
      return { items, total };
    },
    findMembership(companyId, membershipId, client = prisma) {
      return client.companyMembership.findFirst({
        where: { id: membershipId, companyId },
        select: membershipSelect,
      });
    },
    countActiveMemberships(companyId, client = prisma) {
      return client.companyMembership.count({
        where: { companyId, status: 'ACTIVE' },
      });
    },
    countActiveOwners(companyId, client = prisma) {
      return client.companyMembership.count({
        where: {
          companyId,
          status: 'ACTIVE',
          roles: { some: { role: { code: 'OWNER' } } },
        },
      });
    },
    async createMembership(
      { companyId, userId, roles, assignedByUserId },
      client = prisma,
    ) {
      const membership = await client.companyMembership.create({
        data: { companyId, userId },
        select: { id: true },
      });
      await client.companyMembershipRole.createMany({
        data: roles.map(({ id: roleId }) => ({
          membershipId: membership.id,
          companyId,
          roleId,
          assignedByUserId,
        })),
      });
      return this.findMembership(companyId, membership.id, client);
    },
    async updateMembershipStatus(
      companyId,
      membershipId,
      expectedUpdatedAt,
      status,
      client = prisma,
    ) {
      const result = await client.companyMembership.updateMany({
        where: { id: membershipId, companyId, updatedAt: expectedUpdatedAt },
        data: { status, securityVersion: { increment: 1 } },
      });
      return result.count === 1
        ? this.findMembership(companyId, membershipId, client)
        : null;
    },
    async replaceMembershipRoles(
      { companyId, membershipId, roles, assignedByUserId, expectedUpdatedAt },
      client = prisma,
    ) {
      const claimed = await client.companyMembership.updateMany({
        where: { id: membershipId, companyId, updatedAt: expectedUpdatedAt },
        data: {
          securityVersion: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      if (claimed.count !== 1) return null;
      await client.companyMembershipRole.deleteMany({
        where: { membershipId },
      });
      await client.companyMembershipRole.createMany({
        data: roles.map(({ id: roleId }) => ({
          membershipId,
          roleId,
          companyId,
          assignedByUserId,
        })),
      });
      return this.findMembership(companyId, membershipId, client);
    },
    async listRoles(companyId, { page, pageSize, search, sortBy, sortOrder }) {
      const where = {
        companyId,
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
        prisma.companyRole.findMany({
          where,
          select: roleSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.companyRole.count({ where }),
      ]);
      return { items, total };
    },
    findRole(companyId, roleId, client = prisma) {
      return client.companyRole.findFirst({
        where: { id: roleId, companyId },
        select: roleSelect,
      });
    },
    createRole(companyId, data, client = prisma) {
      return client.companyRole.create({
        data: { companyId, ...data, isSystem: false },
        select: roleSelect,
      });
    },
    async updateRole(
      companyId,
      roleId,
      expectedUpdatedAt,
      data,
      client = prisma,
    ) {
      const result = await client.companyRole.updateMany({
        where: { id: roleId, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1
        ? this.findRole(companyId, roleId, client)
        : null;
    },
    deleteRole(companyId, roleId, expectedUpdatedAt, client = prisma) {
      return client.companyRole.deleteMany({
        where: { id: roleId, companyId, updatedAt: expectedUpdatedAt },
      });
    },
    findCompanyPermissions(codes, client = prisma) {
      return client.permission.findMany({
        where: { code: { in: codes }, scope: 'COMPANY' },
        select: { id: true, code: true },
      });
    },
    async replaceRolePermissions(
      { companyId, roleId, permissions, assignedByUserId, expectedUpdatedAt },
      client = prisma,
    ) {
      const claimed = await client.companyRole.updateMany({
        where: { id: roleId, companyId, updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      await client.companyRolePermission.deleteMany({ where: { roleId } });
      if (permissions.length > 0) {
        await client.companyRolePermission.createMany({
          data: permissions.map(({ id: permissionId }) => ({
            roleId,
            permissionId,
            companyId,
            assignedByUserId,
          })),
        });
      }
      return this.findRole(companyId, roleId, client);
    },
  };
}
