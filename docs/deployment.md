# Deployment

The project ships provider-neutral container targets for development, database
migrations, and production. Deployments must keep schema migration separate from
normal application startup so multiple replicas never race to modify the schema.

## Local Docker Compose

Start MySQL, apply migrations, and run the API:

```bash
docker compose up --build
```

The API is available at `http://localhost:3000` by default. Override host ports
without changing container configuration:

```bash
API_PORT=8080 MYSQL_PORT=3307 docker compose up --build
```

PowerShell equivalent:

```powershell
$env:API_PORT = '8080'
$env:MYSQL_PORT = '3307'
docker compose up --build
```

Compose uses local-only placeholder credentials. Do not reuse them in a shared
environment. MySQL data persists in the named `mysql_data` volume, and the first
initialization creates separate `app` and `app_test` databases. Separate one-shot
services apply committed migrations to both databases before the API starts.

Useful commands:

```bash
docker compose ps
docker compose logs -f api
docker compose run --rm api npm run prisma:seed
docker compose run --rm api npm test
docker compose down
```

`docker compose down` preserves database data. Adding `--volumes` deletes the
named MySQL volume and is destructive; use it only when intentionally resetting
local data.

## Image targets

The Dockerfile exposes three operational targets:

- `development`: source, Prisma CLI, and development dependencies.
- `migrations`: the development toolchain with `prisma migrate deploy` as its
  command.
- `production`: runtime source and production dependencies only, running as the
  unprivileged `node` user.

Build the production image:

```bash
docker build --target production -t predator-backend:release .
```

If the backend should host a real frontend build, replace the contents of
`public/` before building and set these runtime values:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=/app/public
```

## Production release sequence

Prepare a production environment file outside source control. It must include
real database credentials, a unique signing secret, secure cookies, allowed
origins, proxy settings appropriate to the platform, and every validated
variable from `.env.example`.

Build both operational targets from the same commit:

```bash
docker build --target migrations -t predator-backend-migrations:release .
docker build --target production -t predator-backend:release .
```

Then release in this order:

1. Back up the database and verify restoration procedures.
2. Run the migrations target once using production environment variables.
3. Start the new production image.
4. Wait for `/api/v1/health` and the container health check to pass.
5. Enable traffic only after health succeeds.

Example commands for a single Docker host:

```bash
docker run --rm --env-file .env.production \
  predator-backend-migrations:release

docker run -d --name predator-backend \
  --env-file .env.production \
  -p 3000:3000 \
  predator-backend:release
```

The database must be reachable from the container. `localhost` inside a
container refers to that container, not the Docker host or a separate database
container.

## Health and termination

The production image health check calls `/api/v1/health` using the configured
`PORT`. Platforms should send `SIGTERM` during replacement and allow at least
`SHUTDOWN_TIMEOUT_MS` before forcefully killing the container. The application
then stops accepting traffic, drains active requests, and disconnects Prisma.

## Rollback

Application rollback and database rollback are separate decisions:

- Keep the previous immutable application image available and restore traffic
  to it when the schema remains backward compatible.
- Prisma does not generate automatic down migrations. Prefer additive,
  backward-compatible schema changes and staged removals.
- For a destructive migration failure, stop writes and restore the verified
  database backup according to the deployment runbook.
- Never run `prisma migrate dev` in production.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`. It installs
with `npm ci`, checks formatting and lint, validates and generates Prisma, applies
migrations to an isolated MySQL service, runs the complete test suite, and builds
the final production image. CI uses disposable credentials and never depends on
development or production databases.
