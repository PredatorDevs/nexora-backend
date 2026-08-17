import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/create-app.js';

function createMeasurementUnitsApp(
  permissionCodes = ['measurement_units.read'],
) {
  const repository = {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: 1, name: 'UNIDAD', symbol: 'U', mhCode: '59', isActive: true },
      ],
      total: 1,
    }),
  };
  const app = createApp({
    services: {
      auth: {
        authenticate: vi.fn().mockResolvedValue({
          userId: 1,
          companyId: 11,
          membershipId: 22,
          companyPermissionCodes: permissionCodes,
        }),
      },
      rbac: {
        getCompanyPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
        getPlatformPermissionCodes: vi.fn().mockResolvedValue(permissionCodes),
      },
      measurementUnits: repository,
    },
    settings: {
      auth: { refreshCookieName: 'test_refresh' },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
  return { app, repository };
}

describe('measurement units API', () => {
  it('lists searchable units with pagination metadata', async () => {
    const { app, repository } = createMeasurementUnitsApp();
    const response = await request(app)
      .get('/api/v1/measurement-units?search=unidad&fiscalOnly=true')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ mhCode: '59' });
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'unidad', fiscalOnly: true }),
    );
  });

  it('requires catalog permission', async () => {
    const { app } = createMeasurementUnitsApp([]);
    const response = await request(app)
      .get('/api/v1/measurement-units')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
  });
});
