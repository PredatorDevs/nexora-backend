# Vercel deployment

This repository can be deployed as one Vercel project containing both the
Express API and the compiled single-page application in `public/`.

Vercel detects `src/app.js` as the Express entry point. This adapter imports
Express directly and exports the application assembled by `src/server.js`.
When `VERCEL=1`, the server does not open a listener, connect eagerly to the
database, or register the container shutdown lifecycle. Local Node.js and
Docker execution retain those behaviors.

## Routing

`vercel.json` keeps the API and frontend surfaces separate:

- Existing files under `public/` are served by Vercel's CDN.
- `/api` and `/api/**` are handled by Express.
- Express redirects `/` to `/login` on Vercel.
- Other non-API paths fall back to `public/index.html` for SPA routing.
- Hashed assets receive immutable caching; `index.html` is never cached.

Set `SERVE_FRONTEND=false` in Vercel. The application enforces it when
`VERCEL=1`, because Vercel owns static file delivery.

## Environment variables

Configure these for Production and, when needed, Preview. Never upload `.env`.

For S3-backed file uploads, also configure the canonical variables documented
in `docs/file-storage.md`. Never expose AWS credentials through frontend
variables or `VITE_*` names; only presigned upload data is sent to the browser.

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE

ACCESS_TOKEN_SECRET=REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS
ACCESS_TOKEN_EXPIRES_IN=10m
ACCESS_TOKEN_ISSUER=nexora-backend
ACCESS_TOKEN_AUDIENCE=nexora-clients
REFRESH_TOKEN_EXPIRES_IN_DAYS=30

REFRESH_COOKIE_NAME=app_refresh_token
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

CORS_ALLOWED_ORIGINS=https://YOUR_PROJECT.vercel.app

LOG_LEVEL=info
TRUST_PROXY=true
JSON_BODY_LIMIT=100kb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=5
REQUEST_TIMEOUT_MS=30000
HEADERS_TIMEOUT_MS=15000
KEEP_ALIVE_TIMEOUT_MS=5000
SHUTDOWN_TIMEOUT_MS=10000

SERVE_FRONTEND=false
FRONTEND_DIST_PATH=

PUBLIC_APP_URL=https://YOUR_PROJECT.vercel.app
MAIL_TRANSPORT=resend
RESEND_API_KEY=re_REPLACE_WITH_YOUR_RESEND_API_KEY
MAIL_FROM_EMAIL=noreply@YOUR_VERIFIED_DOMAIN
MAIL_FROM_NAME=Nexora ERP
MAIL_REPLY_TO=support@YOUR_VERIFIED_DOMAIN
```

`PORT` defaults to `3000` and `TEST_DATABASE_URL` is required only when
`NODE_ENV=test`. Do not keep initial-administrator variables in Vercel.

If the frontend uses another domain, include its exact origin in
`CORS_ALLOWED_ORIGINS`. Multiple origins are comma-separated. For a cross-site
frontend, use `COOKIE_SAME_SITE=none` together with `COOKIE_SECURE=true`.

Transactional invitation email uses Nodemailer over Resend SMTP. Resend uses
`smtp.resend.com:465`, username `resend`, and `RESEND_API_KEY` as the SMTP
password. `MAIL_FROM_EMAIL` must belong to a domain verified in Resend.
`MAIL_REPLY_TO` is optional. Use `MAIL_TRANSPORT=log` locally; invitation links
are then logged and returned by the development API instead of being emailed.

## Database

`DATABASE_URL` must point to an externally reachable MySQL or MariaDB service;
`localhost`, Docker service names, and private-only addresses will not work.
Prefer a provider or proxy with serverless connection pooling. Prisma is reused
inside each warm function instance, but separate instances create separate
pools.

Apply committed migrations outside normal application startup:

```bash
npm ci
npm run prisma:deploy
npm run prisma:seed
```

Run the seed only when the target environment needs the system RBAC catalog.
Create the first administrator from a trusted environment with
`npm run admin:create`, not from an HTTP endpoint.

## Deployment and verification

Commit the current `public/index.html` and frontend assets, then import this
repository into Vercel as the project root. Keep Framework Preset, Build Command,
and Output Directory on their detected/default values. `postinstall` generates
the Prisma client.

After deployment verify:

1. `GET /api/v1/health` returns HTTP 200 and JSON.
2. `/` reaches the login screen.
3. Refreshing a client-side route loads the SPA.
4. Login sets the secure refresh cookie and authenticated calls work.
5. Unknown `/api/**` routes return JSON, never `index.html`.

The current rate limiter is in-memory and applies per warm Vercel instance. For
high traffic, replace its store with a shared Redis-compatible implementation
or enforce a distributed limit at the edge.
