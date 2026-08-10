import { describe, expect, it, vi } from 'vitest';
import {
  expectedEconomicActivityCount,
  loadEconomicActivities,
  parseEconomicActivities,
} from '../../../prisma/seed/economic-activities.data.js';
import { seedEconomicActivities } from '../../../prisma/seed/economic-activities.seed.js';
import { economicActivitiesListQuery } from '../../../src/modules/economic-activities/economic-activities.schemas.js';

describe('economic activity source', () => {
  it('loads the complete catalog with unique five-digit codes', async () => {
    const activities = await loadEconomicActivities();

    expect(activities).toHaveLength(expectedEconomicActivityCount);
    expect(new Set(activities.map(({ code }) => code)).size).toBe(
      expectedEconomicActivityCount,
    );
    expect(activities.every(({ code }) => /^\d{5}$/.test(code))).toBe(true);
    expect(activities[0]).toMatchObject({
      code: '01111',
      name: 'Cultivo de cereales excepto arroz y para forrajes',
      isActive: true,
    });
  });

  it('rejects incomplete catalogs', () => {
    expect(() => parseEconomicActivities('')).toThrow(
      'Expected 774 economic activities, received 0',
    );
  });
});

describe('economic activity seed', () => {
  it('upserts every activity by its stable code', async () => {
    const prisma = {
      economicActivity: {
        upsert: vi.fn(async ({ create }) => ({ id: 1, ...create })),
      },
    };

    await expect(seedEconomicActivities(prisma)).resolves.toBe(774);
    expect(prisma.economicActivity.upsert).toHaveBeenCalledTimes(774);
    expect(prisma.economicActivity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { code: '01111' },
      }),
    );
  });
});

describe('economic activity query schema', () => {
  it('defaults to active activities ordered by code', () => {
    expect(economicActivitiesListQuery.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'code',
      sortOrder: 'asc',
      activeOnly: true,
    });
  });
});
