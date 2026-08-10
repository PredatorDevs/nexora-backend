# Authentication and sessions

Passwords are hashed with Argon2id. Login responses contain a short-lived access
token while refresh credentials are sent only through an HttpOnly cookie.

## Access tokens

Access tokens are signed HS256 JWTs containing only `sub`, `sid`, and
`securityVersion`, plus standard issuer, audience, issued-at, and expiration
claims. Every authenticated request verifies the signature and claims, then
checks the referenced MySQL session, user status, and current security version.
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

Login has a dedicated rate limit and always returns the same credential error for
unknown users, incorrect passwords, and inactive accounts.

## Initial administrator

Set all three `INITIAL_ADMIN_*` variables temporarily, run
`npm run admin:create`, and then remove the password from `.env`. Re-running the
command preserves an existing password and only ensures assignment of the
`SUPER_ADMIN` role. The RBAC seed must run first.
