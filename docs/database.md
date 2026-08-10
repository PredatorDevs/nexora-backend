# Database architecture

The boilerplate uses MySQL 8 or newer through Prisma ORM. Application and test
databases are configured separately. Prisma selects `TEST_DATABASE_URL` when
`NODE_ENV=test` and refuses to start when both URLs are equal.

## Naming and identifiers

- Tables and columns use `snake_case` in MySQL.
- Administrative entities use unsigned auto-incrementing integers.
- Authentication sessions and token families use application-generated UUIDs.
- Timestamps use millisecond precision and must be written and interpreted as UTC.

## Initial model

The initial migration creates users, roles, permissions, explicit user-role and
role-permission assignments, revocable authentication sessions, and immutable
audit records. Assignment tables preserve who granted access and when.

Foreign keys are indexed explicitly. Deleting a user cascades their sessions and
role memberships, while audit actor references become null so historical events
remain available. Audit records have no update or delete API.

## Commands

- `npm run prisma:format`: formats the Prisma schema.
- `npm run prisma:validate`: validates the schema and configuration.
- `npm run prisma:generate`: regenerates the JavaScript client.
- `npm run prisma:migrate -- --name <name>`: creates and applies a development migration.
- `npm run prisma:deploy`: applies committed migrations non-interactively.

Never run `prisma migrate dev` in production. Deployments must use the committed
migration history with `prisma migrate deploy`.
