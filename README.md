# Nexora Backend Boilerplate

Reusable backend foundation built with Node.js, Express, and ESM.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Start development mode with `npm run dev`.
4. Open `http://localhost:3000/api/v1/health`.

## Commands

- `npm run dev`: starts the API in watch mode.
- `npm start`: starts the API normally.
- `npm run lint`: checks JavaScript source files.
- `npm run format:check`: verifies formatting.
- `npm run config:check`: validates all environment variables without starting the API.
- `npm run db:check`: verifies application and test database connectivity.
- `npm test`: runs the automated tests.
- `npm run test:unit`: runs isolated unit tests.
- `npm run test:integration`: runs HTTP and database integration tests.
- `npm run test:e2e`: runs complete public-API workflows.
- `npm run test:coverage`: runs tests with coverage.
- `npm run prisma:validate`: validates the Prisma schema.
- `npm run prisma:generate`: regenerates the database client.
- `npm run prisma:migrate -- --name <name>`: creates a development migration.
- `npm run prisma:deploy`: applies committed migrations non-interactively.
- `npm run prisma:seed`: idempotently creates RBAC permissions and system roles.
- `npm run admin:create`: creates or assigns the configured initial administrator.

Docker development:

```bash
docker compose up --build
```

## Current scope

Phase 12 completes the boilerplate with session-backed authentication, dynamic
RBAC, administrative APIs, immutable auditing, optional SPA hosting, automated
testing, hardened lifecycle controls, containers, and continuous integration.

## Environment configuration

Copy `.env.example` to `.env` and replace its placeholder credentials and secret.
Every variable is validated before the server opens a port.

| Variable                        | Purpose                                                                     |
| ------------------------------- | --------------------------------------------------------------------------- |
| `NODE_ENV`                      | Selects `development`, `test`, or `production`.                             |
| `PORT`                          | HTTP port from 1 to 65535.                                                  |
| `DATABASE_URL`                  | MySQL URL for development or production.                                    |
| `TEST_DATABASE_URL`             | Dedicated MySQL URL used only by tests; it must differ from `DATABASE_URL`. |
| `ACCESS_TOKEN_SECRET`           | Access-token signing secret with at least 32 characters.                    |
| `ACCESS_TOKEN_EXPIRES_IN`       | Short duration such as `10m` or `1h`.                                       |
| `ACCESS_TOKEN_ISSUER`           | Expected issuer claim for access tokens.                                    |
| `ACCESS_TOKEN_AUDIENCE`         | Expected audience claim for access tokens.                                  |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Positive refresh-session lifetime in days.                                  |
| `REFRESH_COOKIE_NAME`           | Name of the HttpOnly refresh cookie.                                        |
| `COOKIE_SECURE`                 | Must be `true` in production.                                               |
| `COOKIE_SAME_SITE`              | Cookie policy: `strict`, `lax`, or `none`.                                  |
| `CORS_ALLOWED_ORIGINS`          | Comma-separated list of absolute origins.                                   |
| `LOG_LEVEL`                     | Pino-compatible log level.                                                  |
| `TRUST_PROXY`                   | Enables Express proxy trust when deployed behind a trusted proxy.           |
| `JSON_BODY_LIMIT`               | Maximum accepted JSON payload, for example `100kb`.                         |
| `RATE_LIMIT_WINDOW_MS`          | General rate-limit window in milliseconds.                                  |
| `RATE_LIMIT_MAX`                | Maximum requests per client during the window.                              |
| `LOGIN_RATE_LIMIT_WINDOW_MS`    | Dedicated login rate-limit window.                                          |
| `LOGIN_RATE_LIMIT_MAX`          | Maximum login attempts per client in the window.                            |
| `REQUEST_TIMEOUT_MS`            | Maximum time to receive a complete HTTP request.                            |
| `HEADERS_TIMEOUT_MS`            | Maximum time to receive headers; cannot exceed request timeout.             |
| `KEEP_ALIVE_TIMEOUT_MS`         | Idle keep-alive connection timeout.                                         |
| `SHUTDOWN_TIMEOUT_MS`           | Grace period before remaining connections are forced closed.                |
| `SERVE_FRONTEND`                | Enables hosting a compiled frontend from this API process.                  |
| `FRONTEND_DIST_PATH`            | Required when `SERVE_FRONTEND=true`.                                        |
| `INITIAL_ADMIN_EMAIL`           | Optional bootstrap administrator email.                                     |
| `INITIAL_ADMIN_PASSWORD`        | Temporary bootstrap password; remove after creation.                        |
| `INITIAL_ADMIN_DISPLAY_NAME`    | Bootstrap administrator display name.                                       |

## HTTP contract

Successful and failed API responses include the request ID in `meta.requestId`.
Clients may supply a safe `X-Request-Id`, otherwise the API generates a UUID and
returns it in the response header. Unknown `/api` routes always return JSON.

The HTTP pipeline applies structured logging with secret redaction, Helmet, a
CORS allowlist, compression, JSON and cookie parsing, payload limits, and a
general rate limit before dispatching application routes.

## Database

Persistence uses MySQL 8+ and Prisma ORM. The initial migration includes users,
roles, permissions, explicit RBAC assignments, authentication sessions, and audit
logs. See `docs/database.md` for conventions, relationships, and migration rules.

Seeded read-only business catalogs include Salvadoran address dictionaries and
economic activities. See `docs/address-dictionaries.md` and
`docs/economic-activities.md` for their data contracts and API endpoints.

The ERP uses global user identities with company-scoped memberships, sessions,
RBAC, auditing, and business data. See `docs/multi-company-architecture.md` for
the ERS-aligned target model, company structure, isolation rules, and
implementation sequence. The current global RBAC is the migration source, not
the final business authorization boundary.

Authorization checks permission codes rather than role names. See
`docs/authorization.md` for the permission catalog, system-role safeguards, and
the `authorize('resource.action')` middleware contract.

Authentication uses Argon2id, signed access tokens, and rotating refresh sessions.
See `docs/authentication.md` for flows, cookie rules, endpoints, and initial
administrator creation.

Administrative routes include bounded pagination, safe sorting, transactional
assignments, system-role safeguards, and immediate session revocation. See
`docs/administration.md` for the complete endpoint map and invariants.

Sensitive authentication and administrative mutations generate controlled audit
events. `GET /api/v1/audit` is protected by `audit.read`, and no public mutation
endpoint exists. See `docs/auditing.md` for events, privacy rules, and extension
guidance.

Successful mutations of critical administration entities also generate
transactional before/after snapshots in the append-only
`entity_change_logs` table. See `docs/entity-change-logging.md` for coverage,
secret handling, and the extension checklist.

The API can optionally serve a compiled frontend from the directory selected by
`FRONTEND_DIST_PATH`, including safe SPA fallback and cache policies. See
`docs/frontend-hosting.md` for build layout and deployment behavior.

Unit, integration, and end-to-end suites use an isolated test database and
collision-safe fixtures. See `docs/testing.md` for commands, cleanup rules, and
the reference RBAC/session lifecycle.

Security hardening includes strict cookie-operation origins, bounded server
timeouts, safe proxy configuration, and graceful shutdown with Prisma cleanup.
See `docs/security.md` for operational requirements and deployment guidance.

The multi-stage Dockerfile provides development, migration, and non-root
production targets. Docker Compose supplies local MySQL and health checks, while
GitHub Actions verifies quality, migrations, tests, and the production image.
See `docs/deployment.md` for release order and rollback guidance.

For a combined Vercel deployment of the Express API and the compiled SPA from
`public/`, see `docs/vercel-deployment.md`.
