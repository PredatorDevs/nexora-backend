import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/create-app.js';

function appWith(permissionCodes, companyId = 11) {
  const branch = {
    id: 4,
    companyId,
    code: 'SS01',
    name: 'San Salvador',
    status: 'ACTIVE',
    updatedAt: '2026-08-17T00:00:00.000Z',
  };
  const branches = {
    list: vi
      .fn()
      .mockResolvedValue({
        branches: [branch],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
    get: vi.fn().mockResolvedValue(branch),
    create: vi.fn().mockResolvedValue(branch),
    update: vi.fn().mockResolvedValue(branch),
    changeStatus: vi.fn().mockResolvedValue({ ...branch, status: 'INACTIVE' }),
  };
  return {
    branches,
    app: createApp({
      services: {
        auth: {
          authenticate: vi
            .fn()
            .mockResolvedValue({
              userId: 1,
              sessionId: 'session',
              mustChangePassword: false,
              companyId,
              membershipId: 22,
            }),
        },
        rbac: {
          getCompanyPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
        },
        branches,
      },
      settings: {
        auth: { refreshCookieName: 'test_refresh' },
        cookie: { secure: false, sameSite: 'lax' },
        http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
      },
    }),
  };
}

describe('branches API', () => {
  it('always lists within the active tenant', async () => {
    const { app, branches } = appWith(['branches.read']);
    const response = await request(app)
      .get('/api/v1/branches?status=ACTIVE')
      .set('authorization', 'Bearer token');
    expect(response.status).toBe(200);
    expect(branches.list).toHaveBeenCalledWith(
      11,
      expect.objectContaining({ status: 'ACTIVE' }),
    );
  });
  it('enforces company permissions', async () => {
    const { app } = appWith([]);
    const response = await request(app)
      .get('/api/v1/branches')
      .set('authorization', 'Bearer token');
    expect(response.status).toBe(403);
  });
  it('validates the branch payload', async () => {
    const { app, branches } = appWith(['branches.create']);
    const response = await request(app)
      .post('/api/v1/branches')
      .set('authorization', 'Bearer token')
      .send({ code: 'SS01', name: 'San Salvador' });
    expect(response.status).toBe(400);
    expect(branches.create).not.toHaveBeenCalled();
  });
});
