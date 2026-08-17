# Companies

## Purpose and current scope

`Company` is the tenant root for Nexora business data. This implementation
provides platform-level company administration, normalized economic activities,
company memberships, private roles, and company-scoped sessions.

## Data contract

A company contains:

- immutable internal `code`;
- legal and commercial names;
- globally unique NIT and NRC;
- legal address using the shared country catalog and either Salvadoran
  territorial catalogs or foreign free-form administrative fields;
- optional contact, website, and logo storage reference;
- `ACTIVE`, `INACTIVE`, or `SUSPENDED` lifecycle status;
- ISO currency code, IANA timezone, and locale defaults;
- one primary and up to two additional economic activities;
- creation and optimistic-concurrency timestamps.

Economic activities are stored in `company_economic_activities`, not in repeated
columns on `companies`. The composite primary key allows only one row for each
`PRIMARY`, `SECONDARY`, or `TERTIARY` type. A second unique constraint prevents
the same activity from filling two types.

## Validation rules

- Company code uses uppercase letters, digits, underscores, and hyphens.
- A primary economic activity is required.
- Activity types and activity IDs cannot repeat.
- Every selected economic activity must exist and be active.
- Salvadoran addresses require an active department, municipality, and district
  forming one valid hierarchy; foreign addresses instead require free-form
  administrative area and locality and must not reference Salvadoran divisions.
- The user flow for El Salvador is department, district, and automatically
  derived municipality. The API still validates all three identifiers instead
  of trusting the client-side derivation.
- NIT, NRC, and company code remain reserved after deactivation.
- URLs and emails are validated before persistence.
- Currency uses a three-letter uppercase ISO-style code.

The territorial catalog models subdivisions only for El Salvador. Foreign
companies retain an active catalog `countryId` and use `foreignAdministrativeArea`
and `foreignLocality` until country-specific subdivision catalogs are introduced.

## Endpoints

```text
GET   /api/v1/companies
GET   /api/v1/companies/:id
POST  /api/v1/companies
PUT   /api/v1/companies/:id
PATCH /api/v1/companies/:id/status
```

List queries support bounded `page`, `pageSize`, `search`, `sortBy`, `sortOrder`,
and exact `status`. Search covers code, legal name, commercial name, NIT, and
NRC.

Updates require `expectedUpdatedAt`. A stale value returns a concurrency
conflict instead of overwriting another administrator's changes. Company code is
not mutable.

## Permissions

```text
companies.read
companies.create
companies.update
companies.change_status
```

These permissions are assigned to `SUPER_ADMIN` and `ADMIN`; read access is also
included in the current operator and read-only templates. During the RBAC
migration they become explicit `PLATFORM` permissions.

## History

Creates, updates, and status changes emit immutable audit events:

```text
COMPANY.CREATED
COMPANY.UPDATED
COMPANY.STATUS_CHANGED
```

Successful mutations also write safe before/after snapshots to the `companies`
logical entity-change schema in the same transaction. Snapshots contain company
business fields and economic activity IDs, but no uploaded file contents.

Physical deletion is intentionally absent. Inactive or suspended companies keep
their legal identifiers and historical references.

## Applying the migration

The migration depends on the address and economic-activity catalog migrations.
Apply committed migrations in order:

```bash
npm run prisma:deploy
npm run prisma:seed
```

The seed adds the new permission definitions and updates system-role permission
matrices idempotently.

## Next milestone

Company-bound sessions, switching, `authorizeCompany`, and audit tenant context
are implemented. The next business milestone introduces branches as operating
points, followed by warehouses and locations. Each module must retain the tenant
isolation and negative-test requirements established here.
