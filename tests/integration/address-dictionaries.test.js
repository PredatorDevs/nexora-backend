import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/create-app.js';

function createDictionaryApp(permissionCodes = ['address_dictionaries.read']) {
  const repository = {
    listCountries: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          name: 'El Salvador',
          abbreviation: 'SV',
          mhCode: 'SV',
          isActive: true,
        },
      ],
      total: 1,
    }),
    listDepartments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listMunicipalities: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listDistricts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
  const app = createApp({
    services: {
      auth: {
        authenticate: vi.fn().mockResolvedValue({
          userId: 1,
          sessionId: 'test-session',
          mustChangePassword: false,
          companyId: 11,
          membershipId: 22,
          companyPermissionCodes: permissionCodes,
        }),
      },
      rbac: {
        getCompanyPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
      },
      addressDictionaries: repository,
    },
    settings: {
      auth: { refreshCookieName: 'test_refresh' },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
  return { app, repository };
}

describe('address dictionary API', () => {
  it('lists countries with pagination metadata', async () => {
    const { app, repository } = createDictionaryApp();
    const response = await request(app)
      .get('/api/v1/address-dictionaries/countries?search=salvador')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
    expect(repository.listCountries).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'salvador', activeOnly: true }),
    );
  });

  it('requires the address dictionary permission', async () => {
    const { app } = createDictionaryApp([]);
    const response = await request(app)
      .get('/api/v1/address-dictionaries/departments')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('validates hierarchy filters', async () => {
    const { app, repository } = createDictionaryApp();
    const response = await request(app)
      .get('/api/v1/address-dictionaries/municipalities?departmentId=7')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(repository.listMunicipalities).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: 7 }),
    );
  });
});
