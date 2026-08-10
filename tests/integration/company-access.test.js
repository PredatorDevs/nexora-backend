import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/create-app.js';

function appWith(permissionCodes) {
  const companyAccess = {
    listMemberships: vi.fn().mockResolvedValue({
      memberships: [{ id: 7, companyId: 11, status: 'ACTIVE' }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    getMembership: vi.fn(),
    addMembership: vi.fn(),
    changeMembershipStatus: vi.fn(),
    replaceMembershipRoles: vi.fn(),
    listRoles: vi.fn().mockResolvedValue({
      roles: [{ id: 3, companyId: 11, code: 'OWNER' }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    replaceRolePermissions: vi.fn(),
  };
  return {
    companyAccess,
    app: createApp({
      services: {
        auth: {
          authenticate: vi.fn().mockResolvedValue({
            userId: 1,
            sessionId: 'session',
            mustChangePassword: false,
            permissionCodes,
          }),
        },
        rbac: {
          getPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
        },
        companyAccess,
      },
      settings: {
        auth: { refreshCookieName: 'test_refresh' },
        cookie: { secure: false, sameSite: 'lax' },
        http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
      },
    }),
  };
}

describe('company access API', () => {
  it('passes the company boundary to membership queries', async () => {
    const { app, companyAccess } = appWith(['company_members.read']);
    const response = await request(app)
      .get('/api/v1/companies/11/members')
      .set('authorization', 'Bearer token');

    expect(response.status).toBe(200);
    expect(companyAccess.listMemberships).toHaveBeenCalledWith(
      11,
      expect.any(Object),
    );
  });

  it('uses a separate permission for company roles', async () => {
    const { app } = appWith(['company_members.read']);
    const response = await request(app)
      .get('/api/v1/companies/11/roles')
      .set('authorization', 'Bearer token');

    expect(response.status).toBe(403);
  });

  it('rejects malformed company identifiers before the service', async () => {
    const { app, companyAccess } = appWith(['company_members.read']);
    const response = await request(app)
      .get('/api/v1/companies/not-an-id/members')
      .set('authorization', 'Bearer token');

    expect(response.status).toBe(400);
    expect(companyAccess.listMemberships).not.toHaveBeenCalled();
  });
});
