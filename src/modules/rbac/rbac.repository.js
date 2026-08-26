export function createRbacRepository(prisma) {
  return {
    async findPermissionCodesForUser(userId) {
      const permissions = await prisma.permission.findMany({
        where: {
          scope: 'PLATFORM',
          roles: { some: { role: { users: { some: { userId } } } } },
        },
        select: { code: true },
        orderBy: { code: 'asc' },
      });
      return permissions.map(({ code }) => code);
    },
    async findPermissionCodesForMembership(membershipId, companyId) {
      const permissions = await prisma.permission.findMany({
        where: {
          scope: 'COMPANY',
          companyRoles: {
            some: {
              companyId,
              role: {
                memberships: { some: { membershipId, companyId } },
              },
            },
          },
        },
        select: { code: true },
        orderBy: { code: 'asc' },
      });
      return permissions.map(({ code }) => code);
    },
    findPermissionsByCodes(codes) {
      return prisma.permission.findMany({
        where: { code: { in: codes }, scope: 'PLATFORM' },
        select: { id: true, code: true },
      });
    },
    findRoleById(roleId) {
      return prisma.role.findUnique({
        where: { id: roleId },
        select: {
          id: true,
          code: true,
          isSystem: true,
          updatedAt: true,
          permissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      });
    },
    findRolesByIds(roleIds) {
      return prisma.role.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, code: true },
      });
    },
    findUserWithRoles(userId, client = prisma) {
      return client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          roles: { select: { role: { select: { id: true, code: true } } } },
        },
      });
    },
    countActiveUsersWithRoleCode(roleCode, client = prisma) {
      return client.user.count({
        where: {
          status: 'ACTIVE',
          roles: { some: { role: { code: roleCode } } },
        },
      });
    },
    replaceRolePermissions(
      { roleId, permissions, assignedByUserId },
      client = prisma,
    ) {
      return Promise.all([
        client.rolePermission.deleteMany({ where: { roleId } }),
        permissions.length === 0
          ? Promise.resolve({ count: 0 })
          : client.rolePermission.createMany({
              data: permissions.map(({ id: permissionId }) => ({
                roleId,
                permissionId,
                assignedByUserId,
              })),
              skipDuplicates: true,
            }),
      ]);
    },
    replaceUserRoles({ userId, roles, assignedByUserId }, client = prisma) {
      return Promise.all([
        client.userRole.deleteMany({ where: { userId } }),
        roles.length === 0
          ? Promise.resolve({ count: 0 })
          : client.userRole.createMany({
              data: roles.map(({ id: roleId }) => ({
                userId,
                roleId,
                assignedByUserId,
              })),
              skipDuplicates: true,
            }),
      ]);
    },
    claimUserVersion(userId, expectedUpdatedAt, client = prisma) {
      return client.user.updateMany({
        where: { id: userId, updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
    },
    deleteRole(roleId, expectedUpdatedAt, client = prisma) {
      return client.role.deleteMany({
        where: { id: roleId, updatedAt: expectedUpdatedAt },
      });
    },
    claimRoleVersion(roleId, expectedUpdatedAt, client = prisma) {
      return client.role.updateMany({
        where: { id: roleId, updatedAt: expectedUpdatedAt },
        data: { updatedAt: new Date() },
      });
    },
  };
}
