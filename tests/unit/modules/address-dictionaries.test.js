import { describe, expect, it, vi } from 'vitest';
import {
  expectedCounts,
  loadAddressDictionaries,
  parseAddressDictionaries,
} from '../../../prisma/seed/address-dictionaries.data.js';
import { mapWithConcurrency } from '../../../prisma/seed/seed.utils.js';
import { seedAddressDictionaries } from '../../../prisma/seed/address-dictionaries.seed.js';
import {
  countriesListQuery,
  districtsListQuery,
} from '../../../src/modules/address-dictionaries/address-dictionaries.schemas.js';

describe('address dictionary source', () => {
  it('loads the expected normalized hierarchy without orphan districts', async () => {
    const dictionaries = await loadAddressDictionaries();
    expect(
      Object.fromEntries(
        Object.entries(dictionaries).map(([name, rows]) => [name, rows.length]),
      ),
    ).toEqual(expectedCounts);
    expect(
      dictionaries.countries.find(({ abbreviation }) => abbreviation === 'SV'),
    ).toMatchObject({ name: 'El Salvador', mhCode: 'SV' });

    const municipalityKeys = new Set(
      dictionaries.municipalities.map(
        ({ departmentMhCode, mhCode }) => `${departmentMhCode}:${mhCode}`,
      ),
    );
    expect(
      dictionaries.districts.every(({ departmentMhCode, municipalityMhCode }) =>
        municipalityKeys.has(`${departmentMhCode}:${municipalityMhCode}`),
      ),
    ).toBe(true);
  });

  it('rejects incomplete source catalogs', () => {
    expect(() => parseAddressDictionaries('')).toThrow(
      'Expected 249 countries, received 0',
    );
  });
});

describe('seed concurrency utility', () => {
  it('preserves result order and enforces the concurrency limit', async () => {
    let active = 0;
    let maximumActive = 0;
    const mapper = vi.fn(async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    await expect(mapWithConcurrency([1, 2, 3, 4], mapper, 2)).resolves.toEqual([
      2, 4, 6, 8,
    ]);
    expect(maximumActive).toBeLessThanOrEqual(2);
  });

  it('rejects an invalid concurrency value', async () => {
    await expect(mapWithConcurrency([1], vi.fn(), 0)).rejects.toThrow(
      'concurrency must be a positive integer',
    );
  });
});

describe('address dictionary seed', () => {
  it('upserts every normalized row in hierarchy order', async () => {
    let departmentId = 0;
    let municipalityId = 0;
    const prisma = {
      country: {
        upsert: vi.fn(async ({ create }) => ({ id: 1, ...create })),
      },
      department: {
        upsert: vi.fn(async ({ create }) => ({
          id: (departmentId += 1),
          ...create,
        })),
      },
      municipality: {
        upsert: vi.fn(async ({ create }) => ({
          id: (municipalityId += 1),
          ...create,
        })),
      },
      district: {
        upsert: vi.fn(async ({ create }) => ({ id: 1, ...create })),
      },
    };

    await expect(seedAddressDictionaries(prisma)).resolves.toEqual(
      expectedCounts,
    );
    expect(prisma.country.upsert).toHaveBeenCalledTimes(249);
    expect(prisma.department.upsert).toHaveBeenCalledTimes(14);
    expect(prisma.municipality.upsert).toHaveBeenCalledTimes(44);
    expect(prisma.district.upsert).toHaveBeenCalledTimes(262);
  });
});

describe('address dictionary query schemas', () => {
  it('defaults to active records ordered by name', () => {
    expect(countriesListQuery.parse({})).toMatchObject({
      activeOnly: true,
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });

  it('coerces hierarchy filters and rejects invalid identifiers', () => {
    expect(districtsListQuery.parse({ municipalityId: '12' })).toMatchObject({
      municipalityId: 12,
    });
    expect(districtsListQuery.parse({ departmentId: '3' })).toMatchObject({
      departmentId: 3,
    });
    expect(() => districtsListQuery.parse({ municipalityId: '0' })).toThrow();
    expect(() => districtsListQuery.parse({ departmentId: '0' })).toThrow();
  });
});
