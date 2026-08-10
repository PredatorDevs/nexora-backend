# Compiled frontend hosting

The backend can optionally host a compiled single-page application without
depending on the frontend repository location.

## Configuration

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=/absolute/path/to/frontend/dist
```

`FRONTEND_DIST_PATH` may also be relative to the backend process working
directory. The application resolves it at startup and fails immediately when
`index.html` is missing. Keep `SERVE_FRONTEND=false` when a reverse proxy or a
separate service hosts the frontend.

The configured directory must contain the frontend build output, not its source
tree. A typical Vite build contains `index.html` and an `assets` directory.

## Routing order

API routes always run first. Unknown `/api` requests return the standard JSON
404 and never fall through to the SPA. Existing frontend files are served next,
then extensionless `GET` and `HEAD` requests accepting HTML fall back to
`index.html` for client-side routing.

Requests for missing filenames such as `.js`, `.css`, `.png`, or `.ico` do not
receive the SPA entry point. Non-navigation methods also never use the fallback.

## Cache policy

- `index.html` and unversioned files use `Cache-Control: no-cache`.
- filenames containing a hash of at least eight characters use a one-year
  `public, immutable` policy.

This allows deployments to replace the entry point immediately while retaining
content-addressed assets safely in browser and CDN caches.

## Practical examples

The backend serves only the compiled output. It does not execute the frontend
source code or its development server. First generate the build from React, Vue,
Angular, or another framework:

```bash
npm run build
```

Depending on the framework, the generated directory is commonly named `dist`,
`build`, or `out`.

### Separate backend and frontend projects

Given this structure:

```text
PredatorBusiness/
├── predator-backend/
│   ├── src/
│   ├── .env
│   └── package.json
└── predator-frontend/
    ├── src/
    ├── dist/
    │   ├── index.html
    │   └── assets/
    │       ├── index-a1b2c3d4.js
    │       └── index-e5f6a7b8.css
    └── package.json
```

The backend can use an absolute path:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=C:/Users/PredatorDev/Desktop/PredatorBusiness/predator-frontend/dist
```

Alternatively, when the backend process is always started from its project
directory, it can use a relative path:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=../predator-frontend/dist
```

An absolute path is usually clearer for initial local testing. Build the
frontend and then start the backend:

```bash
cd predator-frontend
npm run build

cd ../predator-backend
npm start
```

The application will be available from the backend origin, for example
`http://localhost:3000`. The frontend can call the API using same-origin paths:

```js
fetch('/api/v1/health');
```

### Build copied inside the backend

The compiled files may instead be copied into a backend directory:

```text
predator-backend/
├── public/
│   ├── index.html
│   └── assets/
├── src/
├── .env
└── package.json
```

Use:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=./public
```

The directory name is not significant. The important requirement is that
`index.html` exists directly inside `FRONTEND_DIST_PATH`. If the files instead
have an additional level such as `frontend-dist/dist/index.html`, configure the
complete path:

```env
FRONTEND_DIST_PATH=./frontend-dist/dist
```

### Container or production layout

A single deployable unit can place the compiled frontend in `/app/public`:

```text
/app/
├── src/
├── public/
│   ├── index.html
│   └── assets/
└── package.json
```

Its production configuration is:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=/app/public
```

The deployment process builds the frontend, copies its output into
`/app/public`, starts the backend, and exposes only the backend HTTP port.

### Frontend hosted by another service

When the frontend is deployed separately through services such as Vercel,
Netlify, Cloudflare Pages, or an object-storage CDN, disable static hosting:

```env
SERVE_FRONTEND=false
FRONTEND_DIST_PATH=
CORS_ALLOWED_ORIGINS=https://app.example.com
```

In this arrangement, `https://app.example.com` serves the frontend and a
separate origin such as `https://api.example.com` serves this backend.
