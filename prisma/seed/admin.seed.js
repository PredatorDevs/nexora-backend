import { hashPassword } from '../../src/core/security/password.js';
import { systemRoleCodes } from '../../src/modules/rbac/rbac.constants.js';

export async function seedAdmin(prisma, admin) {
  if (!admin) return null;

  const superAdminRole = await prisma.role.findUnique({
    where: { code: systemRoleCodes.superAdmin },
    select: { id: true },
  });
  if (!superAdminRole) {
    throw new Error(
      'RBAC roles must be seeded before creating an administrator.',
    );
  }

  let user = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true, email: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: admin.email,
        passwordHash: await hashPassword(admin.password),
        displayName: admin.displayName,
      },
      select: { id: true, email: true },
    });
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: user.id, roleId: superAdminRole.id },
    },
    create: { userId: user.id, roleId: superAdminRole.id },
    update: {},
  });

  return user;
}
