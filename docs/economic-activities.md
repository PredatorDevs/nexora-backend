# Economic activities dictionary

The economic activities catalog contains the 774 five-digit codes supplied in
`planning/ECONOMIC_ACTIVITIES_DICTIONARY.sql`. Codes are stored as strings so
leading zeroes remain significant. The source is validated for its expected
row count, code format, and uniqueness before any database writes occur.

Apply the migration and load the catalog with:

```bash
npm run prisma:deploy
npm run prisma:seed
```

The seed upserts by stable activity code with bounded concurrency. It is safe to
run repeatedly or resume after an interruption. Activities are deactivated
through source data rather than deleted so future business records can preserve
their references.

## Read API

Authenticated users with `economic_activities.read` can call:

```text
GET /api/v1/economic-activities
```

The endpoint supports `page`, `pageSize`, `search`, `sortBy`, `sortOrder`, and
`activeOnly`. Search matches activity codes and names. Responses use the common
API envelope and include `meta.pagination`. Mutations are deliberately absent;
catalog changes are delivered through reviewed source and seed data.

## Delivery

Docker production images and reproducible release bundles include `planning/`.
The Vercel function includes every `planning/*.sql` source catalog. Migrations
and seeds remain trusted deployment steps and never run during application
startup.
