import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

describe('compiled frontend hosting', () => {
  let distPath;

  beforeAll(async () => {
    distPath = await mkdtemp(path.join(os.tmpdir(), 'backend-frontend-'));
    await mkdir(path.join(distPath, 'assets'));
    await Promise.all([
      writeFile(
        path.join(distPath, 'index.html'),
        '<!doctype html><html><body>SPA entry</body></html>',
      ),
      writeFile(
        path.join(distPath, 'assets', 'app-a1b2c3d4.js'),
        'globalThis.appLoaded = true;',
      ),
      writeFile(path.join(distPath, 'robots.txt'), 'User-agent: *'),
    ]);
  });

  afterAll(async () => {
    if (distPath) await rm(distPath, { recursive: true, force: true });
  });

  const frontendApp = () =>
    createApp({ frontend: { enabled: true, distPath } });

  it('remains disabled by default', async () => {
    const response = await request(createApp())
      .get('/dashboard')
      .set('accept', 'text/html');

    expect(response.status).toBe(404);
    expect(response.text).not.toContain('SPA entry');
  });

  it('serves versioned assets with immutable caching', async () => {
    const response = await request(frontendApp()).get(
      '/assets/app-a1b2c3d4.js',
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain('appLoaded');
    expect(response.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable',
    );
  });

  it('serves entry and unversioned files without persistent caching', async () => {
    const [entry, unversioned] = await Promise.all([
      request(frontendApp()).get('/index.html'),
      request(frontendApp()).get('/robots.txt'),
    ]);

    expect(entry.headers['cache-control']).toBe('no-cache');
    expect(unversioned.headers['cache-control']).toBe('no-cache');
  });

  it('falls back to the SPA only for HTML navigation requests', async () => {
    const navigation = await request(frontendApp())
      .get('/users/42')
      .set('accept', 'text/html');
    const missingAsset = await request(frontendApp())
      .get('/missing.png')
      .set('accept', '*/*');
    const mutation = await request(frontendApp())
      .post('/users/42')
      .set('accept', 'text/html');

    expect(navigation.status).toBe(200);
    expect(navigation.text).toContain('SPA entry');
    expect(navigation.headers['cache-control']).toBe('no-cache');
    expect(missingAsset.status).toBe(404);
    expect(missingAsset.text).not.toContain('SPA entry');
    expect(mutation.status).toBe(404);
  });

  it('keeps unknown API routes as JSON even when HTML is accepted', async () => {
    const response = await request(frontendApp())
      .get('/api/v1/missing')
      .set('accept', 'text/html');

    expect(response.status).toBe(404);
    expect(response.type).toMatch(/json/);
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(response.text).not.toContain('SPA entry');
  });

  it('fails fast when the configured build has no entry point', () => {
    expect(() =>
      createApp({ frontend: { enabled: true, distPath: null } }),
    ).toThrow(/distribution path is required/);
    expect(() =>
      createApp({
        frontend: { enabled: true, distPath: path.join(distPath, 'missing') },
      }),
    ).toThrow(/Frontend entry point/);
  });
});
