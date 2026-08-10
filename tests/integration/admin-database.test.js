import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/create-app.js';
import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { createAccessTokenService } from '../../src/core/security/access-token.js';
import {
  hashPassword,
  verifyPassword,
} from '../../src/core/security/password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
  parseRefreshCookie,
  serializeRefreshCookie,
} from '../../src/core/security/refresh-token.js';
import { createAuthRepository } from '../../src/modules/auth/auth.repository.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createRbacRepository } from '../../src/modules/rbac/rbac.repository.js';
import { createRbacService } from '../../src/modules/rbac/rbac.service.js';
import { createUsersRepository } from '../../src/modules/users/users.repository.js';
import { createUsersService } from '../../src/modules/users/users.service.js';
import { createRolesRepository } from '../../src/modules/roles/roles.repository.js';
import { createRolesService } from '../../src/modules/roles/roles.service.js';
import { createPermissionsRepository } from '../../src/modules/permissions/permissions.repository.js';
import { createSessionsRepository } from '../../src/modules/sessions/sessions.repository.js';
import { createSessionsService } from '../../src/modules/sessions/sessions.service.js';
import { createAuditRepository } from '../../src/modules/audit/audit.repository.js';
import { createAuditService } from '../../src/modules/audit/audit.service.js';
import { createEntityChangeRepository } from '../../src/modules/entity-changes/entity-change.repository.js';
import { createEntityChangeService } from '../../src/modules/entity-changes/entity-change.service.js';
import { seedAdmin } from '../../prisma/seed/admin.seed.js';
import { seedPermissions } from '../../prisma/seed/permissions.seed.js';
import { seedRoles } from '../../prisma/seed/roles.seed.js';

const databaseSuite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
databaseSuite('administrative API database integration', () => {
  const origin = 'http://localhost:5173';
  const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
  const adminEmail = `admin7-${suffix}@example.test`;
  const userEmail = `user7-${suffix}@example.test`;
  const password = 'phase-7-secure-password';
  const failedLoginRequestId = `audit-login-failed-${suffix}`;
  let prisma;
  let app;
  let adminId;
  let userId;
  let roleId;
  let systemRoleId;
  let adminToken;
  let entityChanges;

  beforeAll(async () => {
    const environment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });
    prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
    await prisma.$connect();
    await seedPermissions(prisma);
    await seedRoles(prisma);
    systemRoleId = (
      await prisma.role.findUniqueOrThrow({ where: { code: 'SUPER_ADMIN' } })
    ).id;
    adminId = (
      await seedAdmin(prisma, {
        email: adminEmail,
        password,
        displayName: 'Phase 7 Admin',
      })
    ).id;
    const runInTransaction = (operation, options) =>
      prisma.$transaction(operation, options);
    const entityChangeService = createEntityChangeService(
      createEntityChangeRepository(prisma),
    );
    entityChanges = entityChangeService;
    const rbacService = createRbacService({
      repository: createRbacRepository(prisma),
      runInTransaction,
      entityChangeService,
    });
    const authService = createAuthService({
      repository: createAuthRepository(prisma),
      accessTokens: createAccessTokenService({
        secret: environment.auth.accessTokenSecret,
        expiresIn: '10m',
        issuer: environment.auth.accessTokenIssuer,
        audience: environment.auth.accessTokenAudience,
      }),
      refreshTokens: {
        generate: generateRefreshToken,
        hash: hashRefreshToken,
        matches: matchesRefreshToken,
        parse: parseRefreshCookie,
        serialize: serializeRefreshCookie,
      },
      passwordVerifier: verifyPassword,
      refreshTokenExpiresInDays: 1,
    });
    const users = createUsersService({
      repository: createUsersRepository(prisma),
      rbacService,
      passwordHasher: hashPassword,
      entityChangeService,
      runInTransaction,
    });
    const roles = createRolesService({
      repository: createRolesRepository(prisma),
      rbacService,
      entityChangeService,
      runInTransaction,
    });
    const audit = createAuditService(createAuditRepository(prisma));
    app = createApp({
      allowedOrigins: [origin],
      services: {
        auth: authService,
        rbac: rbacService,
        users,
        roles,
        permissions: createPermissionsRepository(prisma),
        sessions: createSessionsService(createSessionsRepository(prisma)),
        audit,
        entityChanges: entityChangeService,
      },
      settings: {
        auth: { refreshCookieName: 'admin_test_refresh' },
        cookie: { secure: false, sameSite: 'lax' },
        http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
      },
    });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: adminEmail, password });
    adminToken = login.body.data.accessToken;
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.auditLog.deleteMany({
      where: { requestId: failedLoginRequestId },
    });
    if (adminId || userId)
      await prisma.auditLog.deleteMany({
        where: { actorUserId: { in: [adminId, userId].filter(Boolean) } },
      });
    if (adminId || userId)
      await prisma.entityChangeLog.deleteMany({
        where: { actorUserId: { in: [adminId, userId].filter(Boolean) } },
      });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (roleId) await prisma.role.deleteMany({ where: { id: roleId } });
    if (adminId) await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  const authorized = (method, path) =>
    request(app)[method](path).set('authorization', `Bearer ${adminToken}`);

  it('performs the administrative workflow with effective RBAC', async () => {
    expect(
      (
        await request(app)
          .post('/api/v1/auth/login')
          .set('origin', origin)
          .set('x-request-id', failedLoginRequestId)
          .send({ email: adminEmail, password: 'incorrect-password' })
      ).status,
    ).toBe(401);

    const role = await authorized('post', '/api/v1/roles').send({
      code: `TEST_${suffix}`,
      name: 'Test operator',
    });
    expect(role.status).toBe(201);
    roleId = role.body.data.id;
    const permissions = await authorized(
      'put',
      `/api/v1/roles/${roleId}/permissions`,
    ).send({
      permissionCodes: ['users.read'],
      expectedUpdatedAt: role.body.data.updatedAt,
    });
    expect(permissions.status).toBe(200);

    const user = await authorized('post', '/api/v1/users').send({
      email: userEmail,
      password,
      displayName: 'Test User',
      mustChangePassword: false,
    });
    expect(user.status).toBe(201);
    userId = user.body.data.id;
    expect(user.body.data).not.toHaveProperty('passwordHash');
    const assignedRoles = await authorized(
      'put',
      `/api/v1/users/${userId}/roles`,
    ).send({
      roleIds: [roleId],
      expectedUpdatedAt: user.body.data.updatedAt,
    });
    expect(assignedRoles.status).toBe(200);
    const updatedUser = await authorized('put', `/api/v1/users/${userId}`).send(
      {
        displayName: 'Updated User',
        expectedUpdatedAt: assignedRoles.body.data.updatedAt,
      },
    );
    expect(updatedUser.body.data.displayName).toBe('Updated User');
    const currentAdmin = await authorized('get', `/api/v1/users/${adminId}`);
    expect(
      (
        await authorized(
          'get',
          `/api/v1/users?search=${suffix}&sortBy=email&sortOrder=asc`,
        )
      ).body.meta.pagination.total,
    ).toBeGreaterThan(0);

    expect(
      (
        await authorized('patch', `/api/v1/users/${adminId}/status`).send({
          status: 'INACTIVE',
          expectedUpdatedAt: currentAdmin.body.data.updatedAt,
        })
      ).status,
    ).toBe(409);
    const inactiveUser = await authorized(
      'patch',
      `/api/v1/users/${userId}/status`,
    ).send({
      status: 'INACTIVE',
      expectedUpdatedAt: updatedUser.body.data.updatedAt,
    });
    expect(inactiveUser.status).toBe(200);
    await authorized('patch', `/api/v1/users/${userId}/status`).send({
      status: 'ACTIVE',
      expectedUpdatedAt: inactiveUser.body.data.updatedAt,
    });
    const userChanges = await prisma.entityChangeLog.findMany({
      where: { entityType: 'user', entityId: String(userId) },
      orderBy: { createdAt: 'asc' },
    });
    expect(userChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'CREATE',
          oldValues: null,
          newValues: expect.objectContaining({ email: userEmail }),
        }),
        expect.objectContaining({
          operation: 'UPDATE',
          oldValues: expect.objectContaining({ displayName: 'Test User' }),
          newValues: expect.objectContaining({ displayName: 'Updated User' }),
        }),
      ]),
    );
    const displayNameChange = userChanges.find(
      ({ operation, changedFields }) =>
        operation === 'UPDATE' &&
        Array.isArray(changedFields) &&
        changedFields.includes('displayName'),
    );
    expect(displayNameChange).toMatchObject({
      oldValues: { displayName: 'Test User' },
      newValues: { displayName: 'Updated User' },
      changedFields: ['displayName'],
    });
    const serializedSnapshots = JSON.stringify(
      userChanges.map(({ oldValues, newValues }) => ({
        oldValues,
        newValues,
      })),
    );
    expect(serializedSnapshots).not.toContain(password);
    expect(serializedSnapshots).not.toContain('passwordHash');
    const directChanges = await entityChanges.list({
      page: 1,
      pageSize: 20,
      schemaName: 'administration',
      entityType: 'user',
      entityId: String(userId),
      from: new Date(Date.now() - 60 * 60 * 1000),
      to: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(directChanges).toMatchObject({ changes: expect.any(Array) });
    expect(() => JSON.stringify(directChanges)).not.toThrow();
    const changeList = await authorized(
      'get',
      `/api/v1/entity-changes?entityType=user&entityId=${userId}&from=${encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString())}&to=${encodeURIComponent(new Date(Date.now() + 60 * 60 * 1000).toISOString())}`,
    );
    expect(changeList.status, JSON.stringify(changeList.body)).toBe(200);
    expect(changeList.body.data[0]).not.toHaveProperty('oldValues');
    expect(changeList.body.data[0]).not.toHaveProperty('newValues');
    expect(changeList.body.meta.range).toEqual({
      from: expect.any(String),
      to: expect.any(String),
    });
    const changeDetail = await authorized(
      'get',
      `/api/v1/entity-changes/${changeList.body.data[0].id}`,
    );
    expect(changeDetail.status).toBe(200);
    expect(changeDetail.body.data).toEqual(
      expect.objectContaining({
        oldValues: expect.anything(),
        newValues: expect.anything(),
      }),
    );

    const targetLogin = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: userEmail, password });
    const targetToken = targetLogin.body.data.accessToken;
    expect(
      (
        await request(app)
          .get('/api/v1/users')
          .set('authorization', `Bearer ${targetToken}`)
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post('/api/v1/roles')
          .set('authorization', `Bearer ${targetToken}`)
          .send({ code: 'DENIED', name: 'Denied' })
      ).status,
    ).toBe(403);

    const sessions = await authorized(
      'get',
      `/api/v1/sessions?userId=${userId}&activeOnly=true`,
    );
    expect(sessions.body.data.length).toBeGreaterThan(0);
    const sessionId = sessions.body.data[0].id;
    expect(
      (await authorized('delete', `/api/v1/sessions/${sessionId}`)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get('/api/v1/auth/me')
          .set('authorization', `Bearer ${targetToken}`)
      ).status,
    ).toBe(401);

    const systemRole = await authorized('get', `/api/v1/roles/${systemRoleId}`);
    expect(
      (
        await authorized(
          'delete',
          `/api/v1/roles/${systemRoleId}?expectedUpdatedAt=${encodeURIComponent(systemRole.body.data.updatedAt)}`,
        )
      ).status,
    ).toBe(409);
    expect(
      (await authorized('get', '/api/v1/permissions?pageSize=5')).body.data
        .length,
    ).toBeGreaterThan(0);

    const audit = await authorized(
      'get',
      `/api/v1/audit?actorUserId=${adminId}&pageSize=100`,
    );
    expect(audit.status).toBe(200);
    expect(audit.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'AUTH.LOGIN_SUCCEEDED',
          result: 'SUCCESS',
        }),
        expect.objectContaining({
          action: 'USER.CREATED',
          resourceId: String(userId),
          result: 'SUCCESS',
        }),
        expect.objectContaining({
          action: 'USER.STATUS_CHANGED',
          resourceId: String(adminId),
          result: 'FAILURE',
          metadata: expect.objectContaining({ errorCode: 'RESOURCE_CONFLICT' }),
        }),
        expect.objectContaining({
          action: 'ROLE.PERMISSIONS_CHANGED',
          resourceId: String(roleId),
          result: 'SUCCESS',
        }),
        expect.objectContaining({
          action: 'SESSION.REVOKED',
          resourceId: sessionId,
          result: 'SUCCESS',
        }),
      ]),
    );
    expect(audit.body.data[0].id).toEqual(expect.any(String));

    const failedLogins = await authorized(
      'get',
      '/api/v1/audit?action=AUTH.LOGIN_FAILED&result=FAILURE',
    );
    expect(failedLogins.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorUserId: null,
          requestId: failedLoginRequestId,
          metadata: { errorCode: 'INVALID_CREDENTIALS' },
        }),
      ]),
    );
  }, 90_000);
});
