import 'dotenv/config';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedAdmin } from '../../prisma/seed/admin.seed.js';
import { seedPermissions } from '../../prisma/seed/permissions.seed.js';
import { seedRoles } from '../../prisma/seed/roles.seed.js';
import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { createTestIdentity } from '../factories/test-identity.js';
import { createTestApplication } from '../helpers/create-test-application.js';
import { bearerRequest, responseCookie } from '../helpers/http.js';

const databaseSuite = process.env.TEST_DATABASE_URL ? describe : describe.skip;

databaseSuite('RBAC and session end-to-end lifecycle', () => {
  const origin = 'http://localhost:5173';
  const adminIdentity = createTestIdentity('e2e-admin');
  const userIdentity = createTestIdentity('e2e-user');
  let prisma;
  let app;
  let adminId;
  let userId;
  let roleId;
  let adminToken;

  beforeAll(async () => {
    const environment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });
    prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
    await prisma.$connect();
    await seedPermissions(prisma);
    await seedRoles(prisma);
    adminId = (
      await seedAdmin(prisma, {
        email: adminIdentity.email,
        password: adminIdentity.password,
        displayName: 'E2E administrator',
      })
    ).id;
    app = createTestApplication({
      prisma,
      environment,
      origin,
      refreshCookieName: 'e2e_refresh',
    });
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: adminIdentity.email, password: adminIdentity.password });
    expect(login.status).toBe(200);
    adminToken = login.body.data.accessToken;
  }, 45_000);

  afterAll(async () => {
    if (!prisma) return;
    if (adminId || userId) {
      await prisma.auditLog.deleteMany({
        where: { actorUserId: { in: [adminId, userId].filter(Boolean) } },
      });
    }
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    if (roleId) await prisma.role.deleteMany({ where: { id: roleId } });
    if (adminId) await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  it('removes effective permission and then revokes refresh access', async () => {
    const role = await bearerRequest(
      app,
      adminToken,
      'post',
      '/api/v1/roles',
    ).send({ code: userIdentity.roleCode, name: 'E2E reader' });
    expect(role.status).toBe(201);
    roleId = role.body.data.id;

    const assignedPermissions = await bearerRequest(
      app,
      adminToken,
      'put',
      `/api/v1/roles/${roleId}/permissions`,
    ).send({
      permissionCodes: ['users.read'],
      expectedUpdatedAt: role.body.data.updatedAt,
    });
    expect(assignedPermissions.status).toBe(200);

    const user = await bearerRequest(
      app,
      adminToken,
      'post',
      '/api/v1/users',
    ).send({
      email: userIdentity.email,
      password: userIdentity.password,
      displayName: 'E2E user',
      mustChangePassword: false,
    });
    expect(user.status).toBe(201);
    userId = user.body.data.id;

    expect(
      (
        await bearerRequest(
          app,
          adminToken,
          'put',
          `/api/v1/users/${userId}/roles`,
        ).send({
          roleIds: [roleId],
          expectedUpdatedAt: user.body.data.updatedAt,
        })
      ).status,
    ).toBe(200);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: userIdentity.email, password: userIdentity.password });
    expect(login.status).toBe(200);
    const userToken = login.body.data.accessToken;
    const refreshCookie = responseCookie(login);

    expect(
      (await bearerRequest(app, userToken, 'get', '/api/v1/users')).status,
    ).toBe(200);

    expect(
      (
        await bearerRequest(
          app,
          adminToken,
          'put',
          `/api/v1/roles/${roleId}/permissions`,
        ).send({
          permissionCodes: [],
          expectedUpdatedAt: assignedPermissions.body.data.updatedAt,
        })
      ).status,
    ).toBe(200);

    const forbidden = await bearerRequest(
      app,
      userToken,
      'get',
      '/api/v1/users',
    );
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');

    const sessions = await bearerRequest(
      app,
      adminToken,
      'get',
      `/api/v1/sessions?userId=${userId}&activeOnly=true`,
    );
    expect(sessions.status).toBe(200);
    const sessionId = sessions.body.data[0].id;
    expect(
      (
        await bearerRequest(
          app,
          adminToken,
          'delete',
          `/api/v1/sessions/${sessionId}`,
        )
      ).status,
    ).toBe(200);

    const rejectedRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('cookie', refreshCookie);
    expect(rejectedRefresh.status).toBe(401);
    expect(rejectedRefresh.body.error.code).toBe('SESSION_REVOKED');
  }, 90_000);
});
