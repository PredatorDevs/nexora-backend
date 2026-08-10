# Company memberships and RBAC

## Implementation status

This milestone implements company membership persistence, company-owned roles,
permission scopes, role templates, company-bound authorization, and
cross-company database constraints.

Authentication sessions carry one active membership. The endpoints in this
document use `authorizeCompany` and reject a route company ID that differs from
the authenticated tenant.

## Persistence model

```text
User
└── CompanyMembership
    ├── Company
    └── CompanyMembershipRole
        └── CompanyRole
            └── CompanyRolePermission
                └── Permission(scope = COMPANY)
```

Global `Role` and `UserRole` records remain the platform RBAC source during the
migration. Company roles use separate tables so existing administrators and
sessions continue working while role codes such as `ADMIN` can be reused safely
inside every company.

`CompanyMembershipRole` stores `companyId` in addition to its relationship IDs.
Composite foreign keys require both the membership and role to belong to that
same company. Service filters and database constraints therefore reinforce one
another.

## Membership rules

- A user has at most one membership in a company.
- A membership always has at least one role.
- Only an existing active global user can be added in this milestone.
- The first active membership in a company must have `OWNER`.
- An active company always retains at least one active owner after onboarding.
- Suspending or deactivating a membership increments `securityVersion`.
- Replacing roles increments `securityVersion`.
- Membership reads and mutations always include both company and membership ID.
- A resource that exists in another company is reported as not found.

The future invitation flow will create pending identities or invitations without
requiring an administrator to set a password. It is intentionally separate from
the current operation that adds an existing user by email.

## Default company roles

Every company receives private copies of:

```text
OWNER
ADMIN
OPERATOR
READ_ONLY
```

They are provisioned inside the company-creation transaction. The idempotent
seed also provisions them for companies created before this migration.

System company roles cannot be edited or deleted through the API. Custom roles
can be created and assigned any permission whose persisted scope is `COMPANY`.
Platform permissions are rejected by the company-role service.

## Permission scopes

`Permission.scope` is `PLATFORM` or `COMPANY`. Company permissions include
shared catalog reads and company access administration. Runtime resolution
filters by scope: global roles cannot supply company authority and memberships
cannot supply platform authority.

## Endpoints

Memberships:

```text
GET   /api/v1/companies/:companyId/members
GET   /api/v1/companies/:companyId/members/:membershipId
POST  /api/v1/companies/:companyId/members
PATCH /api/v1/companies/:companyId/members/:membershipId/status
PUT   /api/v1/companies/:companyId/members/:membershipId/roles
```

Company roles:

```text
GET    /api/v1/companies/:companyId/roles
GET    /api/v1/companies/:companyId/roles/:roleId
POST   /api/v1/companies/:companyId/roles
PUT    /api/v1/companies/:companyId/roles/:roleId
DELETE /api/v1/companies/:companyId/roles/:roleId
PUT    /api/v1/companies/:companyId/roles/:roleId/permissions
```

Mutations use `expectedUpdatedAt` where a persisted record already exists.
Assignment replacement and owner checks run in serializable transactions.

## Audit and history

Membership and role mutations emit stable audit actions and transactional entity
snapshots. `companyId` and `actorMembershipId` are indexed relational columns on
both histories and are derived from the authenticated session.

## Verification requirements

Automated tests cover:

- malformed and unauthorized HTTP access;
- first-owner enforcement;
- final-owner status and role safeguards;
- rejection of role IDs from another company;
- not-found behavior for cross-company membership IDs;
- real MySQL composite-key behavior;
- idempotent permission and role-template provisioning.
