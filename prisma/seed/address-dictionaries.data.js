import { readFile } from 'node:fs/promises';

const expectedCounts = Object.freeze({
  countries: 249,
  departments: 14,
  municipalities: 44,
  districts: 262,
});

// The source dump omitted the original city IDs, but its district foreign keys
// retain the contiguous 263..306 range in the exact city insertion order.
const firstLegacyMunicipalityId = 263;

function repairMojibake(value) {
  if (!/[ÃÂ]/.test(value)) return value;
  return Buffer.from(value, 'latin1').toString('utf8');
}

function splitSqlValues(tuple) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < tuple.length; index += 1) {
    const character = tuple[index];
    if (character === "'") {
      if (quoted && tuple[index + 1] === "'") {
        value += "'";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values.map(repairMojibake);
}

function extractTuples(valuesSql) {
  const tuples = [];
  let start = -1;
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < valuesSql.length; index += 1) {
    const character = valuesSql[index];
    if (character === "'") {
      if (quoted && valuesSql[index + 1] === "'") index += 1;
      else quoted = !quoted;
      continue;
    }
    if (quoted) continue;
    if (character === '(') {
      if (depth === 0) start = index + 1;
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(splitSqlValues(valuesSql.slice(start, index)));
        start = -1;
      }
    }
  }

  if (quoted || depth !== 0)
    throw new Error('Malformed address dictionary SQL');
  return tuples;
}

export function rowsForTable(sql, table) {
  const pattern = new RegExp(
    `INSERT\\s+INTO\\s+${table}\\s*\\([^)]*\\)\\s*VALUES`,
    'gi',
  );
  const rows = [];
  while (pattern.exec(sql) !== null) {
    let quoted = false;
    let end = pattern.lastIndex;
    for (; end < sql.length; end += 1) {
      if (sql[end] === "'") {
        if (quoted && sql[end + 1] === "'") end += 1;
        else quoted = !quoted;
      } else if (sql[end] === ';' && !quoted) {
        break;
      }
    }
    if (end === sql.length) throw new Error(`Unterminated INSERT for ${table}`);
    rows.push(...extractTuples(sql.slice(pattern.lastIndex, end)));
    pattern.lastIndex = end + 1;
  }

  return rows;
}

function assertUnique(rows, key, label) {
  const values = rows.map(key);
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate ${label} in address dictionary source`);
  }
}

function assertCount(rows, name) {
  if (rows.length !== expectedCounts[name]) {
    throw new Error(
      `Expected ${expectedCounts[name]} ${name}, received ${rows.length}`,
    );
  }
}

export function parseAddressDictionaries(sql) {
  const countries = rowsForTable(sql, 'countries').map(
    ([name, abbreviation, mhCode, isActive]) => ({
      name,
      abbreviation,
      mhCode,
      isActive: isActive === '1',
    }),
  );

  const departmentRows = rowsForTable(sql, 'departments');
  const departmentBySourceId = new Map();
  const departments = departmentRows
    .map(([name, abbreviation, mhCode, zone, isActive], sourceId) => ({
      sourceId,
      name,
      abbreviation,
      mhCode,
      zone: Number(zone),
      isActive: isActive === '1',
    }))
    .filter(({ mhCode }) => mhCode !== '00');
  departments.forEach((department) =>
    departmentBySourceId.set(department.sourceId, department),
  );

  const municipalityByLegacyId = new Map();
  const municipalities = rowsForTable(sql, 'cities')
    .filter(([departmentSourceId]) => departmentSourceId !== '0')
    .map(([departmentSourceId, name, mhCode, isActive], index) => {
      const department = departmentBySourceId.get(Number(departmentSourceId));
      if (!department)
        throw new Error(`Unknown department ${departmentSourceId}`);
      const municipality = {
        departmentMhCode: department.mhCode,
        name,
        mhCode,
        isActive: isActive === '1',
      };
      municipalityByLegacyId.set(
        firstLegacyMunicipalityId + index,
        municipality,
      );
      return municipality;
    });

  const districts = rowsForTable(sql, 'districts')
    .filter(([municipalityLegacyId]) => municipalityLegacyId !== '0')
    .map(([municipalityLegacyId, name, mhCode, isActive]) => {
      const municipality = municipalityByLegacyId.get(
        Number(municipalityLegacyId),
      );
      if (!municipality) {
        throw new Error(`Unknown legacy municipality ${municipalityLegacyId}`);
      }
      return {
        departmentMhCode: municipality.departmentMhCode,
        municipalityMhCode: municipality.mhCode,
        name,
        mhCode,
        isActive: isActive === '1',
      };
    });

  for (const [name, rows] of Object.entries({
    countries,
    departments,
    municipalities,
    districts,
  }))
    assertCount(rows, name);

  assertUnique(
    countries,
    ({ abbreviation }) => abbreviation,
    'country abbreviation',
  );
  assertUnique(departments, ({ mhCode }) => mhCode, 'department MH code');
  assertUnique(
    municipalities,
    ({ departmentMhCode, mhCode }) => `${departmentMhCode}:${mhCode}`,
    'municipality MH code',
  );
  assertUnique(
    districts,
    ({ departmentMhCode, municipalityMhCode, mhCode }) =>
      `${departmentMhCode}:${municipalityMhCode}:${mhCode}`,
    'district MH code',
  );

  return { countries, departments, municipalities, districts };
}

export async function loadAddressDictionaries(
  sourceUrl = new URL(
    '../../planning/ADDRESS_DICTIONARIES.sql',
    import.meta.url,
  ),
) {
  return parseAddressDictionaries(await readFile(sourceUrl, 'utf8'));
}

export { expectedCounts };
