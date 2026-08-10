# Security hardening

The boilerplate applies defense in depth at configuration, HTTP, authentication,
authorization, persistence, and process-lifecycle boundaries.

## HTTP controls

- Helmet supplies baseline security headers and Express does not expose
  `x-powered-by`.
- CORS accepts only configured absolute origins.
- JSON payload size is bounded by `JSON_BODY_LIMIT`.
- General and login-specific rate limits return the standard `429` contract.
- Unknown API routes and internal failures use sanitized JSON responses.
- List endpoints cap page size and accept only endpoint-specific sort fields.
- Zod schemas select explicit writable fields, preventing mass assignment.

Operations that create, rotate, or clear authentication cookies require a valid
`Origin` header matching `CORS_ALLOWED_ORIGINS`. Requests with a missing or
untrusted origin receive `403 FORBIDDEN`. Non-browser API clients must therefore
send the expected `Origin` when calling login, refresh, logout, or logout-all.

## Cookies and proxy configuration

Refresh cookies are `HttpOnly`; their `Secure` and `SameSite` attributes come
from the environment. Production refuses to start with `COOKIE_SECURE=false`,
and `SameSite=none` also requires a secure cookie.

Set `TRUST_PROXY=true` only when the application is actually behind a trusted
reverse proxy that overwrites forwarding headers. Leaving it disabled prevents
clients from spoofing proxy-derived IP information in direct deployments.

## Server timeouts

```env
REQUEST_TIMEOUT_MS=30000
HEADERS_TIMEOUT_MS=15000
KEEP_ALIVE_TIMEOUT_MS=5000
SHUTDOWN_TIMEOUT_MS=10000
```

`HEADERS_TIMEOUT_MS` cannot exceed `REQUEST_TIMEOUT_MS`. All values have bounded
ranges validated at startup. The request timeout limits receipt of the complete
HTTP request; it is not an application-handler deadline. Adjust these values only
for a measured deployment need because large values increase exposure to
slow-client resource exhaustion.

## Graceful shutdown

On `SIGTERM` or `SIGINT`, the process:

1. Stops accepting new connections.
2. Closes idle keep-alive connections.
3. Waits for active requests up to `SHUTDOWN_TIMEOUT_MS`.
4. Forces remaining connections closed if the deadline expires.
5. Disconnects Prisma and sets the process exit code.

The same shutdown path handles an HTTP server error and is idempotent, so
multiple signals cannot trigger duplicate database disconnections.

## Existing application safeguards

Passwords use Argon2id, refresh tokens are stored only as hashes, sessions are
persisted and revocable, permissions are resolved dynamically, sensitive
mutations are audited, and public responses exclude password and refresh-token
hashes. Application logs and audit metadata redact or reject common secret keys.
