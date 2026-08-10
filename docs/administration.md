# Administrative API

> **Migration status:** these endpoints currently administer global users and
> roles. They will be split into platform administration and company membership
> administration during the multi-company milestone.

All administrative routes require a valid access token and a concrete RBAC
permission. Role names are never used as authorization decisions.

## Users

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `PATCH /api/v1/users/:id/status`
- `PUT /api/v1/users/:id/roles`

Creating a user requires a password but responses never expose its hash. Role
assignment is separate and transactional. Users cannot change their own status
or role assignments. Deactivation increments `securityVersion` and revokes every
active session atomically.

## Roles and permissions

- `GET /api/v1/roles`
- `GET /api/v1/roles/:id`
- `POST /api/v1/roles`
- `PUT /api/v1/roles/:id`
- `DELETE /api/v1/roles/:id`
- `PUT /api/v1/roles/:id/permissions`
- `GET /api/v1/permissions`

Permission assignments are replaced transactionally. System roles cannot be
deleted. Permissions have no generic mutation endpoint because they represent
capabilities implemented in code.

## Sessions

- `GET /api/v1/sessions`
- `DELETE /api/v1/sessions/:id`

Session responses omit refresh-token hashes. Revocation takes effect immediately.

## Target API boundaries

Platform administrators manage global users, companies, platform roles, and
cross-company controls. Company administrators manage memberships and company
roles without receiving general access to the global user table.

The company boundary will expose operations such as:

```text
GET    /api/v1/company/members
POST   /api/v1/company/members
PATCH  /api/v1/company/members/:id/status
PUT    /api/v1/company/members/:id/roles
GET    /api/v1/company/sessions
DELETE /api/v1/company/sessions/:id
```

An invitation by email creates or reuses the global identity internally without
disclosing memberships or profile data from another company. Company session
queries and revocations are scoped to the active company.

## Listing conventions

List endpoints support `page`, `pageSize`, `search`, `sortBy`, and `sortOrder`
where applicable. Page size is capped at 100 and sorting uses endpoint-specific
allowlists. Sessions additionally support `userId` and `activeOnly`.
