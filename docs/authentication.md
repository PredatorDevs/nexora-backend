# Authentication and sessions

> **Migration status:** company-bound sessions, selection, switching, and tenant
> claims are implemented. Branch selection remains outside session authority.

Passwords are hashed with Argon2id. Login responses contain a short-lived access
token while refresh credentials are sent only through an HttpOnly cookie.

## Access tokens

Access tokens are signed HS256 JWTs containing `sub`, `sid`, and
`securityVersion`. A company-bound token additionally contains `companyId`,
`membershipId`, and `membershipSecurityVersion`. The three company claims are
accepted only as one complete unit. Every request verifies the token against the
MySQL session, user, company, membership, and both security versions.

Permissions are deliberately not authoritative JWT claims.

## Refresh tokens

Refresh tokens contain 256 random bits and are bound to a UUID session. MySQL
stores only their SHA-256 hashes. Refresh rotates the token atomically; presenting
an older token revokes the entire session family as a reuse response. Sessions
also support current-session and all-session revocation.

Cookie options are environment-aware: HttpOnly is always enabled, Secure is
mandatory in production, and SameSite is configurable. Browser requests that
operate on authentication cookies must have an allowed Origin. Non-browser API
clients may omit Origin.

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/permissions`
- `GET /api/v1/auth/companies`
- `POST /api/v1/auth/switch-company`

Login selects the only active membership automatically. With several active
memberships it creates a global authenticated selection session and returns
`requiresCompanySelection: true` plus the available companies. The user then
switches without submitting credentials again.

Switching verifies the target membership, current refresh credential, and
authenticated session. It updates context atomically, rotates the refresh token,
issues a new access token, and audits the transition. The frontend must discard
company-scoped caches after success.

One session has one active company. A branch is selected per operation or as a
client preference and is always validated against that company.

Login has a dedicated rate limit and always returns the same credential error for
unknown users, incorrect passwords, and inactive accounts.

The ERS additionally requires account lockout after five failed attempts. This
must be implemented independently from IP rate limiting, with generic responses,
audited lock and unlock transitions, and a defined expiry or administrator
unlock policy.

## Initial administrator

Set all three `INITIAL_ADMIN_*` variables temporarily, run
`npm run admin:create`, and then remove the password from `.env`. Re-running the
command preserves an existing password and only ensures assignment of the
`SUPER_ADMIN` role. The RBAC seed must run first.
