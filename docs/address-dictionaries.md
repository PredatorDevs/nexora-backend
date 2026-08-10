# Address dictionaries

The address hierarchy consists of countries and the current Salvadoran
administrative structure:

```text
Country
Department
└── Municipality
    └── District
```

Countries form an independent worldwide catalog. Departments, municipalities,
and districts model only El Salvador, so departments deliberately do not carry
a `countryId`.

`planning/ADDRESS_DICTIONARIES.sql` is the supplied source catalog. The seed
parser repairs its legacy text encoding and reconstructs relationships without
reusing its inconsistent numeric IDs. It validates 249 countries, 14
departments, 44 municipalities, and 262 districts before writing any rows.

The artificial `Otro (Para extranjeros)` rows are deliberately excluded.
Future address records should always require a country. Salvadoran addresses
should reference the complete department/municipality/district hierarchy;
foreign addresses should leave those references null and store their
administrative divisions as free text.

Apply the schema and load the dictionaries with:

```bash
npm run prisma:deploy
npm run prisma:seed
```

The seed uses stable abbreviations and contextual MH codes with `upsert`, so it
is safe to run repeatedly. It processes each hierarchy level with limited
concurrency instead of one long interactive transaction, which avoids Prisma
transaction expiration against remote databases. If execution is interrupted,
run it again to continue safely. Dictionary rows are deactivated explicitly
through source data rather than deleted, preserving future address references.

## Read API

Authenticated users with `address_dictionaries.read` can query:

- `GET /api/v1/address-dictionaries/countries`
- `GET /api/v1/address-dictionaries/departments`
- `GET /api/v1/address-dictionaries/municipalities?departmentId=<id>`
- `GET /api/v1/address-dictionaries/districts?municipalityId=<id>`

Every endpoint supports `page`, `pageSize`, `search`, `sortBy`, `sortOrder`, and
`activeOnly`. Departments additionally support `zone`. Responses use the common
API envelope and include `meta.pagination`. There are deliberately no mutation
endpoints; catalog changes are delivered through reviewed source and seed data.

## Delivery

The seed parser reads `planning/ADDRESS_DICTIONARIES.sql`. Docker production
images, reproducible release bundles, and the Vercel function explicitly include
that source file. Migrations and seeds still run as a trusted deployment step,
never during application startup.
