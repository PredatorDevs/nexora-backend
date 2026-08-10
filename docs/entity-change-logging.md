# Entity change logging

> **Migration status:** existing administration history is installation-wide.
> New company aggregates require tenant context before they are introduced.

The boilerplate keeps two complementary immutable histories:

- `audit_logs` records who attempted a sensitive action, its result, request
  context, and safe operational metadata.
- `entity_change_logs` records the persisted state before and after a successful
  entity mutation.

Entity changes are written by the application, in the same database transaction
as the mutation. A change-log failure therefore rolls back the business change.
Database triggers are not the primary mechanism because they cannot reliably
identify the authenticated actor, request ID, or business reason.

## Data model

Each `entity_change_logs` row contains:

- `schema_name`: stable logical domain, currently `administration`.
- `entity_type` and `entity_id`: logical entity identity.
- `operation`: `CREATE`, `UPDATE`, or `DELETE`.
- `source`: `APPLICATION`, `SYSTEM_JOB`, `MIGRATION`, or `DATABASE_TRIGGER`.
- `actor_user_id` and `request_id`: correlation with the actor and HTTP request.
- `old_values` and `new_values`: explicitly allowlisted JSON snapshots. Updates
  contain only affected business properties; creates and deletes retain the
  complete allowed snapshot.
- `changed_fields`: top-level snapshot fields whose values changed.
- `metadata`: optional safe business context, such as `STATUS_CHANGE`.
- `created_at`: immutable event time.

The table is append-only. The repository intentionally exposes only `create`;
there is no application update or delete operation.

The target model adds nullable `companyId`, `actorMembershipId`, `branchId`, and
`operationId`. Company mutations require context derived from the authenticated
session. Collection and detail queries inject the active company; fetching a
change by its ID alone is insufficient.

This history is not the inventory Kardex. Inventory requires its own append-only
business ledger with quantities, locations, and source documents.

## Covered mutations

The initial implementation covers the critical administration entities:

| Entity                     | Mutations                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------- |
| User                       | Create, profile administration update, status change, administrative password reset |
| User role assignment       | Complete replacement of the user's role-code set                                    |
| Role                       | Create, update, delete                                                              |
| Role permission assignment | Complete replacement of the role's permission-code set                              |

Assignment changes are stored as aggregate sets because the public operation
replaces the complete relationship. This makes the before/after state easier to
understand than one event per join-table row.

## Snapshot compaction

Entity serializers always produce complete safe snapshots so future modules do
not need custom diff logic. Before persistence, the central service applies:

| Operation | Stored values                                         |
| --------- | ----------------------------------------------------- |
| `CREATE`  | `oldValues: null`; complete allowed `newValues`       |
| `UPDATE`  | Only changed business properties in both JSON objects |
| `DELETE`  | Complete allowed `oldValues`; `newValues: null`       |

The comparison ignores `id`, `createdAt`, and `updatedAt`, because identity is
already stored in `entityId` and timestamps would create noise on every update.
An update that changes only those technical fields does not create an entity
change row. Its attempted business action may still be present in `audit_logs`.

Arrays are compared and stored as complete values. For example, a role
assignment stores the previous and new `roleCodes` sets rather than a nested
added/removed patch. This keeps the generic contract predictable for future
entities.

Compaction applies to newly recorded updates. Existing immutable rows are not
rewritten or backfilled.

## Snapshot and secret policy

Snapshots are explicit per entity in
`src/modules/entity-changes/entity-change.snapshots.js`. Do not pass raw Prisma
objects to the logging service.

The user snapshot deliberately excludes:

- password hashes and submitted passwords;
- refresh tokens and token hashes;
- cookies and authorization headers;
- internal credentials or secrets.

When adding a sensitive field to an entity, it is excluded by default until its
snapshot function explicitly allows it. Tests must prove that credential fields
cannot enter a snapshot.

## Adding another entity

1. Add a stable logical entity type and, if needed, a logical schema constant.
2. Create an allowlisted snapshot serializer.
3. Read the old state before mutation.
4. Perform the mutation inside `runInTransaction`.
5. Record the old and new snapshots through `entityChangeService` using the
   transaction client.
6. Return or commit only after the change row is created.
7. Add tests for create/update/delete semantics, rollback, and secret exclusion.
8. Add the entity to the coverage table in this document.

For a delete, `newValues` is `null`. For a create, `oldValues` is `null`. A soft
delete remains an `UPDATE` with a safe reason in `metadata`.

## Read API

Both endpoints require authentication and `audit.read`:

```text
GET /api/v1/entity-changes
GET /api/v1/entity-changes/:id
```

The collection endpoint returns summaries without `oldValues` or `newValues`.
The detail endpoint returns the stored full or compacted snapshots according to
the operation. This prevents a page of JSON objects from consuming database
bandwidth and browser memory when an operator needs only one record.

List filters:

| Parameter     | Rule                                    |
| ------------- | --------------------------------------- |
| `page`        | Positive integer; defaults to `1`       |
| `pageSize`    | Between `1` and `50`; defaults to `20`  |
| `schemaName`  | Defaults to `administration`            |
| `entityType`  | Exact logical entity type               |
| `entityId`    | Exact identifier; requires `entityType` |
| `operation`   | `CREATE`, `UPDATE`, or `DELETE`         |
| `actorUserId` | Positive user ID                        |
| `from`, `to`  | ISO 8601 timestamps with timezone       |

If dates are omitted, the API uses the most recent seven days. Explicit ranges
cannot exceed 90 days. The effective timestamps are returned in `meta.range`.
Results use a stable `createdAt DESC, id DESC` order.

Indexes support the main access paths:

- logical schema and date;
- logical schema, entity type, and date;
- exact schema/entity/identifier and date;
- actor and date.

## Operational policy

- Application database credentials should be the only normal writer.
- Direct database modifications are discouraged and will not automatically
  obtain HTTP actor context.
- Triggers may be introduced only for a table that has an authorized external
  writer. Such rows must use `DATABASE_TRIGGER` and must not duplicate the
  application event.
- Retention, archival, and privacy requirements must be decided before storing
  regulated personal data in new snapshots.
- Read access remains administrative and must not be exposed to general users.

## Rollout plan

### Completed

1. Add the Prisma model and forward-only migration.
2. Add the append-only repository, service, constants, and safe serializers.
3. Integrate users, roles, and their assignment mutations transactionally.
4. Preserve request correlation and authenticated actor identity.
5. Add unit coverage for normalization and credential exclusion.
6. Add indexed, date-bounded summary and lazy-detail read endpoints.

### Next

1. Exercise the migration and integration suite against the isolated MySQL test
   database.
2. Define retention and archive periods with the product/privacy owner.
3. Extend coverage only to important business aggregates as they are introduced.
4. Consider cursor pagination if a single 90-day indexed window grows large
   enough for deep offset pages to become measurable.
5. Consider trigger-based fallback only if a second authorized database writer
   is approved.
