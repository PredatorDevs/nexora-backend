# Authorization and RBAC

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
