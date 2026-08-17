# Branches

## Purpose

`Branch` is the company-scoped operating point used by purchases, sales,
inventory, transfers, billing, reporting, and the future warehouse hierarchy.
Every branch belongs to exactly one company and is only addressable through the
active company session.

## Data contract

- immutable `code`, unique inside the company;
- `name`, unique inside the company;
- `isHeadquarters`, with at most one headquarters per company;
- country and `addressLine`, plus a complete Salvadoran hierarchy or foreign
  administrative area and locality;
- optional phone and email;
- `ACTIVE`, `INACTIVE`, or `SUSPENDED` status;
- creation and optimistic-concurrency timestamps.

The shared country catalog is global, while the normalized subdivision catalog
currently covers El Salvador. Foreign branches therefore store
`foreignAdministrativeArea` and `foreignLocality` without inventing references
to Salvadoran subdivisions.

## Business rules

- Creation and reactivation require an active company.
- Salvadoran addresses require a valid department, municipality, and district;
  foreign addresses require free-form administrative area and locality.
- For Salvadoran data entry, selecting a district after the department derives
  its municipality automatically; the backend validates the resulting hierarchy.
- Codes are generated automatically and never reused. Codes and names cannot repeat within a company, including inactive branches.
- Assigning a new headquarters atomically removes the flag from the previous
  headquarters. A company may temporarily have no headquarters, but never two.
- Branches are not physically deleted. Status changes retain references and
  history. Future warehouses and transactions must reject inactive branches.
- Future warehouse relationships must carry `companyId` and use the composite
  branch identity `(id, companyId)` to prevent cross-tenant references.

## Endpoints

```text
GET   /api/v1/branches
GET   /api/v1/branches/:id
POST  /api/v1/branches
PUT   /api/v1/branches/:id
PATCH /api/v1/branches/:id/status
```

All endpoints require a company-bound access token. Lists support pagination,
search, status, headquarters filtering, and bounded sorting. Updates and status
changes require `expectedUpdatedAt`.

## RBAC and history

```text
branches.read
branches.create
branches.update
branches.change_status
```

Mutations emit `BRANCH.CREATED`, `BRANCH.UPDATED`, and
`BRANCH.STATUS_CHANGED`, plus immutable before/after entity snapshots with the
company and actor membership context.

## Salvadoran fiscal extension

Electronic invoicing may later require establishment and point-of-sale codes.
They are intentionally not included yet: their ownership, uniqueness, document
type interaction, and Hacienda validation must be defined with the billing
module. `Branch.code` is an internal organizational code and must not be reused
as a fiscal identifier.
