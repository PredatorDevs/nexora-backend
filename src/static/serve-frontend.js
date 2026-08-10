import { statSync } from 'node:fs';
import path from 'node:path';

import express from 'express';

const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;
const versionedAssetPattern = /[.-][a-z0-9_-]{8,}\.[a-z0-9]+$/i;

function requireFile(filePath, label) {
  try {
    if (statSync(filePath).isFile()) return;
  } catch {
    // A single configuration error is emitted below without leaking internals.
  }
  throw new Error(`${label} does not exist or is not a file: ${filePath}`);
}

export function registerFrontend(
  app,
  { enabled = false, distPath = null } = {},
) {
  if (!enabled) return;
  if (typeof distPath !== 'string' || distPath.trim().length === 0) {
    throw new Error('Frontend distribution path is required when enabled');
  }

  const root = path.resolve(distPath);
  const indexPath = path.join(root, 'index.html');
  requireFile(indexPath, 'Frontend entry point');

  app.use(
    express.static(root, {
      fallthrough: true,
      index: false,
      maxAge: 0,
      setHeaders(response, filePath) {
        if (versionedAssetPattern.test(path.basename(filePath))) {
          response.setHeader(
            'Cache-Control',
            `public, max-age=${oneYearInMilliseconds / 1000}, immutable`,
          );
        } else {
          response.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );

  app.use((request, response, next) => {
    if (
      !['GET', 'HEAD'].includes(request.method) ||
      path.extname(request.path) ||
      !request.accepts('html')
    ) {
      return next();
    }

    return response.sendFile(
      indexPath,
      { headers: { 'Cache-Control': 'no-cache' } },
      (error) => (error ? next(error) : undefined),
    );
  });
}
