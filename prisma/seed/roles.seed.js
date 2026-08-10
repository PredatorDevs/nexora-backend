import { systemRoleDefinitions } from '../../src/modules/rbac/rbac.constants.js';

export async function seedRoles(prisma) {
  return prisma.$transaction(
    async (transaction) => {
      const permissions = await transaction.permission.findMany({
        select: { id: true, code: true },
      });
      const permissionByCode = new Map(
        permissions.map((permission) => [permission.code, permission]),
      );

      for (const definition of systemRoleDefinitions) {
        const role = await transaction.role.upsert({
          where: { code: definition.code },
          create: {
            code: definition.code,
            name: definition.name,
            description: definition.description,
            isSystem: true,
          },
          update: {
            name: definition.name,
            description: definition.description,
            isSystem: true,
          },
        });

        await transaction.rolePermission.deleteMany({
          where: { roleId: role.id },
        });
        await transaction.rolePermission.createMany({
          data: definition.permissions.map((code) => ({
            roleId: role.id,
            permissionId: permissionByCode.get(code).id,
          })),
          skipDuplicates: true,
        });
      }
    },
    { timeout: 30_000 },
  );
}
