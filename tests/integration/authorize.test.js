import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/create-app.js';
import { authorize } from '../../src/core/middleware/authorize.js';
import { sendSuccess } from '../../src/core/http/responses.js';

function createAuthorizationApp({ auth, permissionCodes = [] } = {}) {
  const rbac = {
    getPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
  };
  const app = createApp({
    services: { rbac },
    routes(expressApp) {
      if (auth) {
        expressApp.use((request_, _response, next) => {
          request_.auth = { ...auth };
          next();
        });
      }
      expressApp.get(
        '/api/v1/protected',
        authorize('users.read'),
        (_request, response) => sendSuccess(response, { allowed: true }),
      );
    },
  });
  return { app, rbac };
}

describe('authorize', () => {
  it('returns 401 without an authenticated identity', async () => {
    const response = await request(createAuthorizationApp().app).get(
      '/api/v1/protected',
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('returns 403 when the effective permission is missing', async () => {
    const { app } = createAuthorizationApp({ auth: { userId: 1 } });
    const response = await request(app).get('/api/v1/protected');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('allows a request with the effective permission', async () => {
    const { app, rbac } = createAuthorizationApp({
      auth: { userId: 1 },
      permissionCodes: ['users.read'],
    });
    const response = await request(app).get('/api/v1/protected');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ allowed: true });
    expect(rbac.getPermissionCodes).toHaveBeenCalledWith(1);
  });

  it('uses permissions already resolved during the request', async () => {
    const { app, rbac } = createAuthorizationApp({
      auth: { userId: 1, permissionCodes: ['users.read'] },
    });
    const response = await request(app).get('/api/v1/protected');

    expect(response.status).toBe(200);
    expect(rbac.getPermissionCodes).not.toHaveBeenCalled();
  });

  it('rejects malformed permission codes during route registration', () => {
    expect(() => authorize('ADMIN')).toThrow(TypeError);
  });
});
