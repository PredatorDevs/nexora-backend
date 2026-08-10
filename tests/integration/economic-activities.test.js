import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/create-app.js';

function createEconomicActivitiesApp(
  permissionCodes = ['economic_activities.read'],
) {
  const repository = {
    list: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          code: '01111',
          name: 'Cultivo de cereales excepto arroz y para forrajes',
          isActive: true,
        },
      ],
      total: 1,
    }),
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
      economicActivities: repository,
    },
    settings: {
      auth: { refreshCookieName: 'test_refresh' },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
  return { app, repository };
}

describe('economic activities API', () => {
  it('lists matching activities with pagination metadata', async () => {
    const { app, repository } = createEconomicActivitiesApp();
    const response = await request(app)
      .get('/api/v1/economic-activities?search=cereales')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ code: '01111' });
    expect(response.body.meta.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'cereales', activeOnly: true }),
    );
  });

  it('requires the economic activities permission', async () => {
    const { app } = createEconomicActivitiesApp([]);
    const response = await request(app)
      .get('/api/v1/economic-activities')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
