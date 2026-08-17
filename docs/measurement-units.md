# Measurement units dictionary

Measurement units are a global, read-only catalog shared by every company. The
source of truth is `planning/MEASUREMENT_UNITS.sql`; it currently contains 75
entries comprising El Salvador Ministry of Finance units and additional
clinical units.

The normalized table is `measurement_units`:

- `name` is the stable, unique seed identity.
- `plural_name` and `symbol` provide display alternatives.
- `mh_code` is nullable and unique when present. Empty values and the source
  marker `N/A` become `NULL`, because non-fiscal units do not have an MH code.
- `comments` preserves fiscal, metrological, or clinical guidance.
- inactive historical entries remain available for referential integrity.

Future product records should reference the catalog through
`measurement_unit_id`; they must not copy names or use the database ID as a
fiscal code. A product may retain an inactive unit already assigned to it, while
new selections should normally request active units only.

## Loading the catalog

```bash
npm run prisma:deploy
npm run prisma:seed
```

Before writing, the seed validates row count, unique names, unique non-null MH
codes, and fiscal-code format. It upserts by name and is safe to run repeatedly.

## Read API

Authenticated users with `measurement_units.read` may call:

```text
GET /api/v1/measurement-units
```

Supported query parameters are `page`, `pageSize`, `search`, `sortBy`,
`sortOrder`, `activeOnly`, and `fiscalOnly`. Both filters default respectively
to `true` and `false`. Search covers singular/plural names, symbols, and MH
codes. Platform company administrators may also query it with `companies.read`.
