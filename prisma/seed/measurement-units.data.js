import { readFile } from 'node:fs/promises';
import { rowsForTable } from './address-dictionaries.data.js';

export const expectedMeasurementUnitCount = 75;

function nullable(value) {
  return value === 'NULL' || value === '' || value === 'N/A' ? null : value;
}

export function parseMeasurementUnits(sql) {
  const units = rowsForTable(sql, 'measurementunits').map(
    ([name, symbol, mhCode, comments, pluralName, isActive]) => ({
      name,
      pluralName: nullable(pluralName),
      symbol: nullable(symbol),
      mhCode: nullable(mhCode),
      comments: nullable(comments),
      isActive: isActive === '1',
    }),
  );

  if (units.length !== expectedMeasurementUnitCount) {
    throw new Error(
      `Expected ${expectedMeasurementUnitCount} measurement units, received ${units.length}`,
    );
  }

  const names = units.map(({ name }) => name);
  if (new Set(names).size !== names.length) {
    throw new Error('Duplicate measurement unit name in source catalog');
  }

  const fiscalCodes = units.flatMap(({ mhCode }) => (mhCode ? [mhCode] : []));
  if (new Set(fiscalCodes).size !== fiscalCodes.length) {
    throw new Error('Duplicate measurement unit MH code in source catalog');
  }
  const invalidFiscalCode = fiscalCodes.find((code) => !/^\d{1,3}$/.test(code));
  if (invalidFiscalCode) {
    throw new Error(`Invalid measurement unit MH code: ${invalidFiscalCode}`);
  }

  return units;
}

export async function loadMeasurementUnits(
  sourceUrl = new URL('../../planning/MEASUREMENT_UNITS.sql', import.meta.url),
) {
  return parseMeasurementUnits(await readFile(sourceUrl, 'utf8'));
}
