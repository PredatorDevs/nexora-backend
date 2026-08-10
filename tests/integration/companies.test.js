import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/create-app.js';

function createCompaniesApp(permissionCodes = ['companies.read']) {
  const company = {
    id: 1,
    code: 'NEXORA',
    legalName: 'Nexora, S.A. de C.V.',
    commercialName: 'Nexora',
    nit: '0614-010101-101-1',
    nrc: '123456-7',
    status: 'ACTIVE',
    updatedAt: '2026-08-10T12:00:00.000Z',
  };
  const service = {
    list: vi.fn().mockResolvedValue({
      companies: [company],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    get: vi.fn().mockResolvedValue(company),
    create: vi.fn().mockResolvedValue(company),
    update: vi.fn().mockResolvedValue(company),
    changeStatus: vi.fn().mockResolvedValue({
      ...company,
      status: 'INACTIVE',
    }),
  };
  const app = createApp({
    services: {
      auth: {
        authenticate: vi.fn().mockResolvedValue({
          userId: 1,
          sessionId: 'test-session',
          mustChangePassword: false,
          permissionCodes,
        }),
      },
      rbac: { getPermissionCodes: vi.fn().mockResolvedValue(permissionCodes) },
      companies: service,
    },
    settings: {
      auth: { refreshCookieName: 'test_refresh' },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
  return { app, service };
}

describe('companies API', () => {
  it('lists companies with platform pagination', async () => {
    const { app, service } = createCompaniesApp();
    const response = await request(app)
      .get('/api/v1/companies?status=ACTIVE&search=nexora')
      .set('authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ code: 'NEXORA' });
    expect(response.body.meta.pagination.total).toBe(1);
    expect(service.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', search: 'nexora' }),
    );
  });

  it('enforces company permissions', async () => {
    const { app } = createCompaniesApp([]);
    const response = await request(app)
      .get('/api/v1/companies')
      .set('authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects a company without a primary economic activity', async () => {
    const { app } = createCompaniesApp(['companies.create']);
    const response = await request(app)
      .post('/api/v1/companies')
      .set('authorization', 'Bearer test-token')
      .send({
        code: 'NEXORA',
        legalName: 'Nexora, S.A. de C.V.',
        commercialName: 'Nexora',
        nit: '0614-010101-101-1',
        nrc: '123456-7',
        countryId: 1,
        departmentId: 1,
        municipalityId: 1,
        districtId: 1,
        addressLine: 'San Salvador',
        economicActivities: [{ economicActivityId: 1, type: 'SECONDARY' }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
