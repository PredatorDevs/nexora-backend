# Auditing

> **Migration status:** company and actor-membership context is persisted and
> indexed. A dedicated company-scoped read API remains a later UI milestone.

The audit module records security and administrative events in `audit_logs`.
Application code writes entries through the audit service; the public API is
read-only and therefore cannot modify or delete audit history.

## Query endpoint

`GET /api/v1/audit` requires `audit.read`. It supports bounded `page` and
`pageSize` parameters plus exact filters for `action`, `actorUserId`,
`resourceType`, and `result`. Results are always ordered by newest first.

## Recorded context

Each entry contains the actor, action, resource, success or failure result,
request ID, IP address, user agent, controlled metadata, and creation time.
Authentication failures intentionally have no actor. The audit service removes
metadata keys associated with passwords, tokens, cookies, authorization headers,
and secrets, including nested values.

## Events

The initial catalog covers successful and failed authentication, token refresh,
logout, user creation and changes, role creation and changes, permission and role
assignments, and administrative session revocation. Reads are not audited by
default to avoid indiscriminate noise.

When adding a sensitive mutation, define its stable action in
`audit.constants.js` and execute the operation through `auditService.execute`.
Metadata must contain only the minimum identifiers or changed-field names needed
for investigation; never pass request bodies, credentials, cookies, or tokens.

## Multi-company audit contract

`AuditLog` contains nullable `companyId` and `actorMembershipId`, derived from
the authenticated request. Platform and pre-selection authentication events may
leave them null. Operational `branchId` and bulk correlation `operationId` will
be introduced when their first domains require them.

The ERS phrase "all accesses" is interpreted as security-relevant access, not
unbounded logging of every GET request. Sensitive reads, exports, authentication
attempts, meaningful authorization failures, mutations, approvals, lifecycle
changes, assignments, and company switches are audited.
