# Account security (phase 15)

Authenticated users can read their identity with `GET /api/v1/auth/me`, update
their display name with `PUT /api/v1/auth/profile`, and change their own
password with `POST /api/v1/auth/change-password`. Cookie-affecting writes
require a trusted `Origin`.

`change-password` accepts `currentPassword` and `newPassword` (minimum 12
characters). It increments `securityVersion`, clears `mustChangePassword`,
revokes every other session, and returns a replacement access token for the
current session.

Administrators with `users.reset_password` may call
`POST /api/v1/users/:id/reset-password` with `password` and optional
`mustChangePassword` (default `true`). The operation increments the target's
security version and revokes all target sessions.

New users default to `mustChangePassword: true`. Login and `/auth/me` expose
the flag. While it is true, permission-protected endpoints return
`PASSWORD_CHANGE_REQUIRED` (403); profile, password change, and session-close
endpoints remain reachable.

Audit actions are `AUTH.PROFILE_UPDATED`, `AUTH.PASSWORD_CHANGED`, and
`USER.PASSWORD_RESET`. Passwords and password hashes are never audit metadata.
