# Automated testing

The test suite uses Vitest and Supertest. Unit tests isolate services and core
utilities, integration tests exercise HTTP or Prisma boundaries, and end-to-end
tests execute complete user workflows through the public API.

## Commands

```bash
npm test                  # complete suite
npm run test:unit         # unit tests only
npm run test:integration  # integration tests only
npm run test:e2e          # end-to-end workflows only
npm run test:coverage     # complete suite with V8 coverage
npm run test:watch        # local watch mode
```

Database suites are skipped when `TEST_DATABASE_URL` is absent. They must never
use `DATABASE_URL`; environment validation rejects equal application and test
URLs. Apply the committed migrations to the test database before running them:

```bash
npm run prisma:deploy
npm test
```

## Test structure

```text
tests/
├── unit/          isolated services and utilities
├── integration/   HTTP infrastructure and database module contracts
├── e2e/           complete public-API workflows
├── factories/     deterministic shapes with collision-safe identities
└── helpers/       application assembly and HTTP test utilities
```

Database files run serially because they share one schema. Each suite creates
uniquely named users, roles, permissions, and sessions, records their identifiers,
and removes them in `afterAll`. Cleanup must be scoped to those identifiers; tests
must never truncate shared tables or remove seed data.

## End-to-end reference workflow

`tests/e2e/rbac-session-lifecycle.test.js` demonstrates the expected security
lifecycle entirely through HTTP:

1. Create a role and grant `users.read`.
2. Create a user and assign that role.
3. Log in as the user and consume the authorized endpoint.
4. Remove the permission from the role.
5. Confirm the same access token now receives `403`.
6. Revoke the persisted session administratively.
7. Confirm its refresh cookie receives `401 SESSION_REVOKED`.

This proves permissions are resolved dynamically rather than trusted from token
claims, and that session revocation takes effect independently of token expiry.

## Adding tests

- Prefer unit tests for business branches that do not need HTTP or MySQL.
- Use integration tests for middleware, serialization, Prisma behavior, and
  endpoint contracts.
- Reserve E2E tests for a small number of critical cross-module workflows.
- Never place real credentials, tokens, or production URLs in fixtures.
- Assert public status codes and error codes instead of internal error text.
- Keep test data collision-safe so interrupted runs do not corrupt later runs.
