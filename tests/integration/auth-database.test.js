import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../src/create-app.js';
import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { createAccessTokenService } from '../../src/core/security/access-token.js';
import { verifyPassword } from '../../src/core/security/password.js';
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
import { seedAdmin } from '../../prisma/seed/admin.seed.js';

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
const databaseSuite = hasTestDatabase ? describe : describe.skip;

databaseSuite('authentication database integration', () => {
  const origin = 'http://localhost:5173';
  const password = 'phase-6-strong-test-password';
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const email = `phase6-${suffix}@example.test`;
  let prisma;
  let app;
  let userId;

  const cookiePair = (response) =>
    response.headers['set-cookie'][0].split(';')[0];

  beforeAll(async () => {
    const environment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });
    prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
    await prisma.$connect();

    const user = await seedAdmin(prisma, {
      email,
      password,
      displayName: 'Phase 6 test user',
    });
    await seedAdmin(prisma, {
      email,
      password,
      displayName: 'Phase 6 test user',
    });
    userId = user.id;

    const authRepository = createAuthRepository(prisma);
    const rbacRepository = createRbacRepository(prisma);
    const rbacService = createRbacService({
      repository: rbacRepository,
      runInTransaction: (operation) => prisma.$transaction(operation),
    });
    const authService = createAuthService({
      repository: authRepository,
      accessTokens: createAccessTokenService({
        secret: environment.auth.accessTokenSecret,
        expiresIn: environment.auth.accessTokenExpiresIn,
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

    app = createApp({
      allowedOrigins: [origin],
      services: { auth: authService, rbac: rbacService },
      settings: {
        auth: { refreshCookieName: 'test_refresh' },
        cookie: { secure: false, sameSite: 'lax' },
        http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
      },
    });
  }, 30_000);

  afterAll(async () => {
    if (!prisma) return;
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('logs in, authenticates, rotates refresh, and detects reuse', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTypeOf('string');
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    const originalCookie = cookiePair(login);

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('authorization', `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);

    const permissions = await request(app)
      .get('/api/v1/auth/permissions')
      .set('authorization', `Bearer ${login.body.data.accessToken}`);
    expect(permissions.body.data.permissions).toContain('users.read');

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('cookie', originalCookie);
    expect(refresh.status).toBe(200);
    const rotatedCookie = cookiePair(refresh);
    expect(rotatedCookie).not.toBe(originalCookie);

    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('cookie', originalCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('SESSION_REVOKED');

    const revoked = await request(app)
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('cookie', rotatedCookie);
    expect(revoked.status).toBe(401);
  });

  it('does not reveal whether credentials or account state caused failure', async () => {
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password: 'incorrect-password' });
    const unknownUser = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: `unknown-${suffix}@example.test`, password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.error).toEqual(unknownUser.body.error);
  });

  it('revokes the current session on logout', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password });
    const cookie = cookiePair(login);
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('origin', origin)
      .set('authorization', `Bearer ${login.body.data.accessToken}`);

    expect(logout.status).toBe(200);
    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('cookie', cookie);
    expect(refresh.body.error.code).toBe('SESSION_REVOKED');
  });

  it('revokes every user session on logout-all', async () => {
    const first = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password });
    const second = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password });

    const logoutAll = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('origin', origin)
      .set('authorization', `Bearer ${first.body.data.accessToken}`);
    expect(logoutAll.status).toBe(200);

    for (const login of [first, second]) {
      const refresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('origin', origin)
        .set('cookie', cookiePair(login));
      expect(refresh.body.error.code).toBe('SESSION_REVOKED');
    }
  });

  it('rejects an inactive user with the generic credential error', async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password });
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
