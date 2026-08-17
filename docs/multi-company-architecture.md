# Multi-company architecture

> **Target-state document:** the current authentication and RBAC implementation
> remains installation-wide until the migration sequence in this document is
> completed.

## Purpose

Nexora is a multi-company ERP. A single installation can administer one or
more companies independently, while a person keeps one global identity and may
belong to several companies.

`Company` is the organizational root for all business domains, including
branches, warehouses, purchases, sales, inventory, human resources, accounting,
and reports. Shared reference catalogs such as countries, Salvadoran territory,
economic activities, and permission definitions remain installation-wide.

This architecture uses company scoping rather than separate databases or schemas
per company.

## Core model

```text
User (global identity)
├── PlatformRole (Nexora administration)
└── CompanyMembership
    ├── Company
    └── CompanyRole
        └── Permission
```

The concepts have separate responsibilities:

- `User` owns credentials, profile, and global account security.
- `Company` owns legal, tax, commercial, organizational, and business data.
- `CompanyMembership` grants a user access to one company and has its own
  lifecycle and security version.
- Platform roles authorize installation-wide administration.
- Company roles authorize operations only within their owning company.
- `Permission` remains the global catalog of capabilities implemented in code.

## User identity and memberships

A user is never duplicated merely because they work in several companies.
Email uniqueness and credentials remain global to the installation.

The membership model must contain at least:

```text
id
companyId
userId
status
securityVersion
joinedAt
createdAt
updatedAt
```

Required constraints and indexes:

```text
UNIQUE(companyId, userId)
INDEX(userId, status)
INDEX(companyId, status)
```

Global user status and membership status are independent. Suspending a
membership removes access only to that company. Suspending the global user
removes access to every company.

Incrementing `CompanyMembership.securityVersion` invalidates that membership's
sessions after critical changes without affecting the user's other companies.

The ERS rule that every user is associated with an employee is deferred and
reinterpreted at membership level. Human Resources is outside version 1 scope,
platform administrators need not be employees, and one user can have a different
employment relationship in each company. A future `employeeId` may therefore be
optional on `CompanyMembership`; it must not be placed directly on `User`.

Every active membership must have at least one active company role. This is the
multi-company interpretation of ERS rule RN003 and is enforced transactionally
in the service layer.

## Active company and sessions

Each authenticated session has exactly one active company. A user can change
company without signing in again, but an individual session never operates in
several company contexts simultaneously.

For example, `juan@dominio.com` may have:

```text
Juan
├── Empresa A — Administrator
└── Empresa B — Owner
```

After identity verification, the login flow resolves active memberships:

1. With no active memberships, business access is denied.
2. With one active membership, Nexora may select it automatically.
3. With several memberships, the user selects the company to enter.
4. The server creates a session bound to the selected membership.

`AuthSession` must reference the active `companyId` and `membershipId`. Access
tokens must carry and validate at least:

```text
sub                         user ID
sid                         session ID
companyId                   active company ID
membershipId                active membership ID
securityVersion             global user security version
membershipSecurityVersion   membership security version
```

The backend remains authoritative. It validates that the token, session, user,
company, and membership agree and are active.

Company switching uses an authenticated operation such as:

```text
POST /api/v1/auth/switch-company
POST /api/v1/auth/switch-platform
```

The server verifies the target membership, rotates the refresh token, changes
the session context atomically, issues an access token for the new company, and
records the event. The client must clear all company-scoped query caches after a
successful switch.

Platform administrators can leave a company context through `switch-platform`.
The operation requires live platform permissions, clears both tenant identifiers,
rotates the refresh credential, and records the transition in the audit log.

Using a caller-provided `X-Company-Id` as the authority for company context is
forbidden. Route parameters or request bodies may identify a requested company,
but they must always be checked against the authenticated context or explicit
platform privileges.

The active branch is an operation parameter or user-interface preference, not
the tenant authority stored permanently in the session. Every submitted branch
must belong to the active company. If later requirements restrict users to
particular branches, a `CompanyMembershipBranch` assignment can be added without
changing the tenant model.

## Company aggregate

The target company aggregate is:

```text
Company
├── id
├── code
├── legalName
├── commercialName
├── nit
├── nrc
├── countryId
├── departmentId
├── municipalityId
├── districtId
├── addressLine
├── phone
├── email
├── website
├── logoStorageKey
├── status
├── defaultCurrencyCode
├── timezone
├── locale
├── createdAt
└── updatedAt

CompanyEconomicActivity
├── companyId
├── economicActivityId
└── type: PRIMARY | SECONDARY | TERTIARY
```

Company rules:

- `legalName`, `commercialName`, `nit`, `nrc`, and the legal address are required
  for the initial importer/distributor scope defined by the ERS.
- `code`, `nit`, and `nrc` are unique across active and inactive records.
- The selected district, municipality, department, and country must form one
  valid catalog hierarchy.
- Exactly one primary economic activity is required. Secondary and tertiary
  activities are optional. An activity and an activity type cannot be repeated.
- Logos are stored in object storage; MySQL keeps only an object key or URL
  reference.
- `status` is an enum such as `ACTIVE`, `INACTIVE`, or `SUSPENDED`, not a boolean.
- Inactive companies retain authorized historical reads but cannot generate new
  business transactions.
- `defaultCurrencyCode`, `timezone`, and `locale` establish deterministic money,
  time, and formatting behavior.
- Companies with business history are never physically deleted.

The v0.6 ERS makes NRC mandatory, so the first implementation follows that rule.
Supporting organizations without an NRC is a future product decision.

## Organizational ownership

The operational hierarchy is:

```text
Company
└── Branch
    └── Warehouse
        └── Location
```

A branch should include a stable `code` unique within its company and an
`isHeadquarters` flag. Only one active headquarters may exist per company. The
company address is the legal domicile; branch addresses are operating points.
Company onboarding may create an initial "Casa matriz" branch, but the records
remain independent.

Warehouses should have a code unique within their branch. Location codes are
unique within their warehouse. Location capacity needs an explicit unit before
it can become an authoritative validation rule.

Warehouse categories are company-owned because the ERS allows companies to
maintain them dynamically. Their names are unique per company. Categories,
warehouses, and locations with history are deactivated instead of deleted, and
a location with stock cannot be deactivated.

The supplier proposal in the ERS omits the tenant key. Suppliers must have a
non-null `companyId`, with `UNIQUE(companyId, code)`. The same legal supplier may
exist independently in two companies with different contacts, terms, and
history. Customers and products follow the same company-scoped code rule.

## Platform and company RBAC

RBAC is divided into two scopes:

```text
PLATFORM
COMPANY
```

Platform roles manage the Nexora installation. Company roles manage operations
within one company. `Role` and `Permission` must declare their scope, and a
company role must reference its owning company.

Recommended role constraints:

```text
PLATFORM role => companyId IS NULL
COMPANY role  => companyId IS NOT NULL
UNIQUE(companyId, code)
```

Assignments are separated:

- `PlatformUserRole` assigns platform roles directly to global users.
- `CompanyMembershipRole` assigns company roles to memberships.

A membership and its assigned role must belong to the same company. This must be
validated in services and, where practical, reinforced by composite database
constraints.

Permissions of one scope cannot be assigned to roles of the other scope.
Authorization uses explicit middleware:

```text
authorizePlatform(permissionCode)
authorizeCompany(permissionCode)
```

Company permission resolution is keyed by membership and company, never by
`userId` alone. Any future permission cache must include `userId`, `companyId`,
membership identity, and relevant security versions.

The current roles are reclassified as follows:

- `SUPER_ADMIN`: platform role.
- `ADMIN`: default company-role template.
- `OPERATOR`: default company-role template.
- `READ_ONLY`: default company-role template.

Default company roles are copied for each company. They are not shared mutable
rows, so customizing a role in one company cannot affect another company.
Nexora must preserve at least one active owner or administrator membership per
company, independently from the platform super-administrator invariant.

## Permission taxonomy

Platform and company permissions must use unambiguous resources. A recommended
initial company administration catalog is:

```text
members.read
members.invite
members.update
members.change_status
members.assign_roles

company_roles.read
company_roles.create
company_roles.update
company_roles.delete
company_roles.assign_permissions

company_sessions.read
company_sessions.revoke
company_audit.read
```

Platform administration starts with capabilities such as:

```text
companies.read
companies.create
companies.update
companies.change_status
platform_users.read
platform_users.update
platform_roles.read
platform_roles.assign
platform_audit.read
```

Shared catalogs may be read through company roles even though their rows have no
`companyId`:

```text
address_dictionaries.read
economic_activities.read
```

Business permissions added later follow their domains, for example
`customers.read`, `sales.create`, or `inventory.adjust`.

Canonical actions are `read`, `create`, `update`, `change_status`, `delete` only
where physical deletion is safe, `assign`, `approve`, `export`, and necessary
domain-specific verbs. ERS terms such as `view`, `activate`, and `deactivate`
must be normalized to this vocabulary before endpoints are implemented.

Permissions remain code-owned and seeded idempotently. Nexora will not expose a
generic permission mutation API: a database permission cannot authorize behavior
that the backend does not implement. Roles and role-permission assignments are
still dynamic.

## Company request context

After authentication, company routes receive an immutable server-derived
context:

```js
request.tenant = Object.freeze({
  userId,
  sessionId,
  companyId,
  membershipId,
});
```

This context feeds repositories, transactions, audit events, entity changes,
structured logs, and asynchronous work. A `companyId` submitted in a business
request body is never trusted as the authorization scope.

## Business-data isolation

Every company-owned business entity must have a non-null `companyId` foreign key.
Examples include branches, warehouses, customers, suppliers, products, sales,
purchases, employees, accounting entries, and company configuration.

Every list, count, lookup, mutation, report, and uniqueness rule must be scoped.
For example:

```js
prisma.sale.findFirst({
  where: {
    id: saleId,
    companyId: request.tenant.companyId,
  },
});
```

Company-owned repositories must not use an unscoped `findUnique({ id })`.
Cross-company resource probes return `404` so the API does not reveal that an
identifier exists elsewhere.

Business uniqueness is generally composite:

```text
UNIQUE(companyId, code)
UNIQUE(companyId, documentNumber)
UNIQUE(companyId, normalizedName)
```

Shared catalogs and platform-owned records are explicit exceptions and do not
receive a company foreign key.

## Audit log

`AuditLog` must add:

```text
companyId nullable
actorMembershipId nullable
```

Company context is mandatory for company operations and null for events that
occur before company selection or belong exclusively to the platform. It is
derived by the server and not accepted as arbitrary event metadata.

Recommended indexes:

```text
INDEX(companyId, createdAt)
INDEX(companyId, action, createdAt)
INDEX(companyId, resourceType, resourceId)
INDEX(companyId, actorUserId, createdAt)
```

Company audit queries always inject the active `companyId`. Only an explicit
platform permission can query across companies. Authentication and company
switch events record enough context to distinguish the previous and next
company without storing credentials or tokens.

## Entity change history

`EntityChangeLog` must also add:

```text
companyId nullable
actorMembershipId nullable
```

Company mutations record these values in the same transaction as the business
change. Collection and detail queries must include the company context; a lookup
by change ID alone is not sufficient.

Recommended indexes begin with `companyId`:

```text
INDEX(companyId, schemaName, entityType, entityId, createdAt)
INDEX(companyId, actorUserId, createdAt)
INDEX(companyId, createdAt)
```

`schemaName` remains a logical domain such as `administration`, `sales`, or
`inventory`; it is not used as a tenant identifier.

Both audit histories may also use nullable `branchId` when operationally relevant
and an `operationId` to correlate bulk or multi-aggregate work. These fields are
server-derived.

The ERS phrase "all accesses" means security-relevant access, not indiscriminate
logging of every GET request. Authentication attempts, meaningful authorization
failures, sensitive reads, exports, mutations, approvals, lifecycle changes,
role changes, and company switches are auditable.

Entity change history is not the inventory Kardex. Inventory requires a separate
append-only business ledger containing company, branch, warehouse, location,
product, quantity, and source-document identity.

## Business document and inventory invariants

Business documents are company-owned and normally branch-owned. They use
explicit state machines instead of mutable confirmation flags. Confirmed
documents are immutable; corrections use cancellation, reversal, return, or a
new compensating document according to the domain.

Stock availability changes and creation of the corresponding Kardex movement
must occur in one transaction. Concurrency controls must prevent negative stock;
a prior read followed by an unchecked update is insufficient.

## Account lockout

ERS rule RN005 requires account lockout after five failed login attempts. This
is separate from the existing IP rate limiter. The implementation must preserve
generic login errors, prevent user enumeration, audit lock and unlock events,
and define either an expiry interval or an administrative unlock workflow.

## Non-functional baseline

The ERS does not quantify its non-functional requirements. New company modules
must nevertheless define and test tenant isolation, bounded pagination, safe
sorting, transaction and concurrency behavior, idempotency for retryable
inventory or financial commands, UTC persistence, company-local presentation,
object-storage policy, audit retention, backup and recovery, observability, and
report/export limits.

## User and session administration

Company administrators manage memberships rather than the global user table:

```text
GET   /api/v1/company/members
POST  /api/v1/company/members
PATCH /api/v1/company/members/:id/status
PUT   /api/v1/company/members/:id/roles
```

Inviting an existing email creates only the membership. Inviting a new email
creates the global user and membership atomically without exposing information
from other companies.

Company administrators see and revoke only sessions in their company.
Suspending a membership revokes its company sessions. Suspending a global user
or changing global credentials follows the broader account-security policy and
may revoke sessions across every company.

## Parallel browser usage

The initial product supports one active company per session. Opening another
browser or browser profile may establish a separate session for another company.
Independent company contexts in multiple tabs of the same browser are deferred,
because a shared refresh cookie would otherwise allow one tab to silently change
the context of another.

## Isolation test requirements

Every company-owned module must prove that:

- A member of company A cannot list company B data.
- A known company B identifier cannot be read, modified, or deleted from A.
- Roles cannot be assigned across company boundaries.
- Audit and entity-change history cannot cross company boundaries.
- The same business code can exist independently in A and B.
- Suspending one membership does not affect another membership.
- Company switching produces a token and session for the intended membership.
- The last active company owner or administrator cannot be removed.
- Company roles cannot grant platform permissions.
- Platform roles are never acquired through company membership.

These checks are required at repository, service, HTTP integration, and complete
workflow levels. Negative cross-company tests are mandatory for every new
business module.

## Implementation sequence

1. Add `Company`, `CompanyEconomicActivity`, and company lifecycle rules.
2. Add `CompanyMembership` and membership security state.
3. Split platform and company roles and assignments.
4. Migrate and seed current system roles and company-role templates safely.
5. Bind business sessions and tokens to one active membership.
6. Add company selection, switching, and immutable request tenant context.
7. Scope audit and entity-change storage and queries.
8. Convert company user administration to membership administration.
9. Add the cross-company isolation test matrix.
10. Implement branches, warehouse categories, warehouses, and locations.
11. Implement suppliers as the first company-owned business aggregate.
12. Add products and the append-only inventory ledger before purchase and sales
    transaction flows.

The first implementation milestone covers steps 1 through 9. Business modules
must not be layered over the current global RBAC model.
