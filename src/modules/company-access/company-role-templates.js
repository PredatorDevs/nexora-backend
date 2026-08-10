import { companyRoleTemplates } from '../rbac/rbac.constants.js';

export async function provisionCompanyRoles(
  client,
  companyId,
  assignedByUserId = null,
) {
  const codes = [
    ...new Set(companyRoleTemplates.flatMap((x) => x.permissions)),
  ];
  const permissions = await client.permission.findMany({
    where: { code: { in: codes }, scope: 'COMPANY' },
    select: { id: true, code: true },
  });
  const permissionByCode = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );
  const missing = codes.filter((code) => !permissionByCode.has(code));
  if (missing.length > 0) {
    throw new Error(
      `Company permissions must be seeded before roles: ${missing.join(', ')}`,
    );
  }

  let ownerRoleId = null;
  for (const template of companyRoleTemplates) {
    const role = await client.companyRole.upsert({
      where: {
        companyId_code: { companyId, code: template.code },
      },
      create: {
        companyId,
        code: template.code,
        name: template.name,
        description: template.description,
        isSystem: true,
      },
      update: {
        name: template.name,
        description: template.description,
        isSystem: true,
      },
    });
    await client.companyRolePermission.deleteMany({
      where: { roleId: role.id },
    });
    await client.companyRolePermission.createMany({
      data: template.permissions.map((code) => ({
        roleId: role.id,
        permissionId: permissionByCode.get(code).id,
        companyId,
        assignedByUserId,
      })),
      skipDuplicates: true,
    });
    if (template.code === 'OWNER') ownerRoleId = role.id;
  }

  if (assignedByUserId != null) {
    const membership = await client.companyMembership.upsert({
      where: {
        companyId_userId: { companyId, userId: assignedByUserId },
      },
      create: { companyId, userId: assignedByUserId },
      update: { status: 'ACTIVE' },
    });
    await client.companyMembershipRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: membership.id,
          roleId: ownerRoleId,
        },
      },
      create: {
        membershipId: membership.id,
        roleId: ownerRoleId,
        companyId,
        assignedByUserId,
      },
      update: { assignedByUserId },
    });
  }
}
