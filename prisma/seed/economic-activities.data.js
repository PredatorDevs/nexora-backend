import { readFile } from 'node:fs/promises';
import { rowsForTable } from './address-dictionaries.data.js';

export const expectedEconomicActivityCount = 774;

export function parseEconomicActivities(sql) {
  const activities = rowsForTable(sql, 'economicactivities').map(
    ([code, name, isActive]) => ({
      code,
      name,
      isActive: isActive === '1',
    }),
  );

  if (activities.length !== expectedEconomicActivityCount) {
    throw new Error(
      `Expected ${expectedEconomicActivityCount} economic activities, received ${activities.length}`,
    );
  }

  const codes = activities.map(({ code }) => code);
  if (new Set(codes).size !== codes.length) {
    throw new Error('Duplicate economic activity code in source catalog');
  }

  const invalidCode = activities.find(({ code }) => !/^\d{5}$/.test(code));
  if (invalidCode) {
    throw new Error(`Invalid economic activity code: ${invalidCode.code}`);
  }

  return activities;
}

export async function loadEconomicActivities(
  sourceUrl = new URL(
    '../../planning/ECONOMIC_ACTIVITIES_DICTIONARY.sql',
    import.meta.url,
  ),
) {
  return parseEconomicActivities(await readFile(sourceUrl, 'utf8'));
}
