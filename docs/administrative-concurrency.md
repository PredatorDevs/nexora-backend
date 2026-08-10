# Administrative protections and concurrency (phase 16)

User and role mutations use optimistic concurrency. Clients send the
`updatedAt` value they loaded as `expectedUpdatedAt`. A changed resource returns
`409 RESOURCE_CONFLICT` with `details.reason: "STALE_WRITE"` and, when known,
`details.currentUpdatedAt`. Clients must reload instead of replaying blindly.

Protected operations include user identity/status/roles/password reset and role
identity/permissions/deletion. Role and user assignment changes claim the
resource version in the same transaction as the replacement.

Existing invariants remain enforced: an active final `SUPER_ADMIN` cannot be
disabled or stripped of that role, users cannot change their own status or role
assignments, and system roles cannot be deleted. Session revocation is
idempotent; administrators must use logout rather than the administrative API
to revoke their current session.

Successful and rejected sensitive operations continue through the audit
wrapper. Conflict metadata contains identifiers and error codes, never secrets.
