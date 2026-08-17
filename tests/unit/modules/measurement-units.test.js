import { describe, expect, it, vi } from 'vitest';
import {
  expectedMeasurementUnitCount,
  loadMeasurementUnits,
  parseMeasurementUnits,
} from '../../../prisma/seed/measurement-units.data.js';
import { seedMeasurementUnits } from '../../../prisma/seed/measurement-units.seed.js';
import { measurementUnitsListQuery } from '../../../src/modules/measurement-units/measurement-units.schemas.js';

describe('measurement unit source', () => {
  it('loads the complete catalog and normalizes non-fiscal codes', async () => {
    const units = await loadMeasurementUnits();

    expect(units).toHaveLength(expectedMeasurementUnitCount);
    expect(units[0]).toMatchObject({ name: 'METRO', mhCode: '1' });
    expect(
      units.find(({ name }) => name === 'CÉLULA POR MICROLITRO'),
    ).toMatchObject({
      symbol: 'células/µL',
      mhCode: null,
    });
  });

  it('rejects incomplete catalogs', () => {
    expect(() => parseMeasurementUnits('')).toThrow(
      'Expected 75 measurement units, received 0',
    );
  });
});

describe('measurement unit seed', () => {
  it('upserts every unit by its stable name', async () => {
    const prisma = {
      measurementUnit: { upsert: vi.fn(async ({ create }) => create) },
    };
    await expect(seedMeasurementUnits(prisma)).resolves.toBe(75);
    expect(prisma.measurementUnit.upsert).toHaveBeenCalledTimes(75);
    expect(prisma.measurementUnit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: 'METRO' } }),
    );
  });
});

describe('measurement unit query schema', () => {
  it('defaults to active units ordered by name', () => {
    expect(measurementUnitsListQuery.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortOrder: 'asc',
      activeOnly: true,
      fiscalOnly: false,
    });
  });
});
