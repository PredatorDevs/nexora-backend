import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { createRbacRepository } from '../../src/modules/rbac/rbac.repository.js';
import { createRbacService } from '../../src/modules/rbac/rbac.service.js';
import { systemRoleDefinitions } from '../../src/modules/rbac/rbac.constants.js';
import { seedPermissions } from '../../prisma/seed/permissions.seed.js';
import { seedRoles } from '../../prisma/seed/roles.seed.js';

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
const databaseSuite = hasTestDatabase ? describe : describe.skip;

databaseSuite('RBAC database integration', () => {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const permissionCode = `phase_${suffix}.read`;
  let prisma;
  let repository;
  let service;
  let userId;
  let roleId;

  beforeAll(async () => {
    const environment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });
    prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
    await prisma.$connect();
    await seedPermissions(prisma);
    await seedRoles(prisma);
    await seedPermissions(prisma);
    await seedRoles(prisma);
    repository = createRbacRepository(prisma);
    service = createRbacService({
      repository,
      runInTransaction: (operation) => prisma.$transaction(operation),
    });

    const permission = await prisma.permission.create({
      data: {
        code: permissionCode,
        resource: `phase_${suffix}`,
        action: 'read',
      },
    });
    const role = await prisma.role.create({
      data: { code: `PHASE5_${suffix}`, name: 'Phase 5 test role' },
    });
    const user = await prisma.user.create({
      data: {
        email: `phase5-${suffix}@example.test`,
        passwordHash: 'not-a-real-password-hash',
        displayName: 'Phase 5 test user',
      },
    });

    roleId = role.id;
    userId = user.id;
    await service.replaceRolePermissions({
      roleId,
      permissionCodes: [permission.code],
    });
    await service.replaceUserRoles({ userId, roleIds: [roleId] });
  });

  afterAll(async () => {
    if (!prisma) return;
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (roleId) await prisma.role.delete({ where: { id: roleId } });
    await prisma.permission.deleteMany({ where: { code: permissionCode } });
    await prisma.$disconnect();
  });

  it('changes effective access when role permissions change', async () => {
    await expect(service.hasPermission(userId, permissionCode)).resolves.toBe(
      true,
    );

    await service.replaceRolePermissions({ roleId, permissionCodes: [] });

    await expect(service.hasPermission(userId, permissionCode)).resolves.toBe(
      false,
    );
  });

  it('keeps system-role seeds idempotent', async () => {
    const systemRoleCount = await prisma.role.count({
      where: {
        code: { in: systemRoleDefinitions.map(({ code }) => code) },
      },
    });

    expect(systemRoleCount).toBe(systemRoleDefinitions.length);
  });
});
