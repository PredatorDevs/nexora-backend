# Companies

## Purpose and current scope

`Company` is the tenant root for Nexora business data. This implementation
provides platform-level company administration and normalized economic
activities. Company memberships and private company roles are now implemented;
company-scoped sessions are the next architecture milestone. Until then, these
endpoints use the existing global authorization middleware with
platform-intended permissions.

## Data contract

A company contains:

- immutable internal `code`;
- legal and commercial names;
- globally unique NIT and NRC;
- legal address using the shared country and Salvadoran territorial catalogs;
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
- The country must be the active El Salvador catalog entry (`SV`) while the
  address model uses Salvadoran departments, municipalities, and districts.
- District, municipality, and department must form one active hierarchy.
- NIT, NRC, and company code remain reserved after deactivation.
- URLs and emails are validated before persistence.
- Currency uses a three-letter uppercase ISO-style code.

The territorial catalog currently models subdivisions only for El Salvador.
Supporting foreign legal addresses will require country-specific subdivision
catalogs or a separate free-form foreign-address contract.

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

The next implementation binds authentication sessions and access tokens to an
active `CompanyMembership`, introduces company switching and `authorizeCompany`,
and promotes company context into audit storage. Company-owned business modules
must wait until those isolation controls and their negative tests pass.
