# Authorization and RBAC

> **Migration status:** this document describes the currently implemented
> installation-wide RBAC. Its target replacement is defined in
> `docs/multi-company-architecture.md`.

Authorization is based on permissions, never on role names. Routes declare the
capability they require with `authorize('resource.action')`. Authentication will
populate `request.auth.userId`; authorization then resolves effective permissions
from MySQL through explicit user-role and role-permission assignments.

## Permission catalog

Permission codes use lowercase `resource.action` notation. The catalog lives in
`src/modules/rbac/rbac.constants.js` so implemented capabilities and seeds share
one source of truth. Adding a protected operation requires adding its permission
to the catalog, assigning it to appropriate roles, and testing its middleware.

## System roles

The idempotent seed creates `SUPER_ADMIN`, `ADMIN`, `OPERATOR`, and `READ_ONLY`.
Endpoints still check permissions rather than these codes. System roles cannot be
deleted, users cannot change their own role assignments, and the service prevents
removal of the final active super administrator.

Run `npm run prisma:seed` after migrations. Re-running it updates system role
metadata and permission matrices without creating duplicates.

## Request behavior

- Missing authenticated identity returns `401 AUTHENTICATION_REQUIRED`.
- Missing effective permission returns `403 FORBIDDEN`.
- A valid permission allows the request to continue.
- Permissions are cached only for the lifetime of a single request.
- Assignment replacement is transactional and records the assigning user.

## Multi-company migration contract

The persistence portion of this migration is implemented: permissions declare a
scope, company roles are private per company, and memberships receive roles
through company-constrained assignment tables. Session-derived company
authorization remains pending.

- `SUPER_ADMIN` becomes a platform role assigned directly to a global user.
- Company roles belong to one company and are assigned to a
  `CompanyMembership`, never directly to `User`.
- Permission definitions remain global and code-owned, but each permission has
  an explicit `PLATFORM` or `COMPANY` scope.
- Effective company permissions are resolved by membership and company. A cache
  keyed only by `userId` is forbidden.
- Routes use `authorizePlatform(code)` or `authorizeCompany(code)` so their
  security boundary is explicit.
- An active membership retains at least one role, and each company retains at
  least one active owner or administrator.

Permission mutation endpoints will not be introduced. Dynamic roles are useful;
arbitrary permissions without behavior implemented in code are not.
