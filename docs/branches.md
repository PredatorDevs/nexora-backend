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
- complete Salvadoran address hierarchy and `addressLine`;
- optional phone and email;
- `ACTIVE`, `INACTIVE`, or `SUSPENDED` status;
- creation and optimistic-concurrency timestamps.

The country is stored explicitly even though the current territorial catalog is
limited to El Salvador. This preserves a complete address contract and leaves a
clear migration path for foreign subdivisions.

## Business rules

- Creation and reactivation require an active company.
- Country, department, municipality, and district must form an active valid
  hierarchy.
- Codes and names cannot repeat within a company, including inactive branches.
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
