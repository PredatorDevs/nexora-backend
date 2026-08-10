import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createApp } from '../../src/create-app.js';
import { sendSuccess } from '../../src/core/http/responses.js';
import { validate } from '../../src/core/middleware/validate.js';
import { registerRoutes } from '../../src/routes/index.js';

function registerTestRoutes(app) {
  registerRoutes(app);

  app.post(
    '/api/v1/echo',
    validate({ body: z.object({ name: z.string().min(2) }).strict() }),
    (request_, response) =>
      sendSuccess(response, request_.validated.body, { statusCode: 201 }),
  );

  app.get('/api/v1/unexpected-error', () => {
    throw new Error('Sensitive internal detail');
  });

  app.get('/api/v1/large-response', (_request, response) => {
    return sendSuccess(response, { content: 'x'.repeat(2048) });
  });
}

describe('HTTP infrastructure', () => {
  it('propagates a valid request ID through headers and response metadata', async () => {
    const response = await request(createApp())
      .get('/api/v1/health')
      .set('x-request-id', 'client-request-123');

    expect(response.headers['x-request-id']).toBe('client-request-123');
    expect(response.body.meta.requestId).toBe('client-request-123');
  });

  it('replaces an unsafe request ID and adds security headers', async () => {
    const response = await request(createApp())
      .get('/api/v1/health')
      .set('x-request-id', '<unsafe value>');

    expect(response.headers['x-request-id']).toMatch(/^[\w-]{36}$/);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('enforces the CORS allowlist using the uniform error contract', async () => {
    const allowed = await request(createApp())
      .get('/api/v1/health')
      .set('origin', 'http://localhost:5173');
    const rejected = await request(createApp())
      .get('/api/v1/health')
      .set('origin', 'https://untrusted.example');

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(rejected.status).toBe(403);
    expect(rejected.body.error.code).toBe('FORBIDDEN');
    expect(rejected.body.meta.requestId).toBeDefined();
  });

  it('validates request data and exposes only parsed values', async () => {
    const app = createApp({ routes: registerTestRoutes });
    const invalid = await request(app).post('/api/v1/echo').send({ name: 'a' });
    const valid = await request(app).post('/api/v1/echo').send({ name: 'Ada' });

    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalid.body.error.details[0]).toMatchObject({
      location: 'body',
      path: 'name',
    });
    expect(valid.status).toBe(201);
    expect(valid.body.data).toEqual({ name: 'Ada' });
  });

  it('handles malformed and oversized JSON uniformly', async () => {
    const app = createApp({ jsonBodyLimit: '16b', routes: registerTestRoutes });
    const malformed = await request(app)
      .post('/api/v1/echo')
      .set('content-type', 'application/json')
      .send('{invalid');
    const oversized = await request(app)
      .post('/api/v1/echo')
      .send({ name: 'a value larger than sixteen bytes' });

    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR');
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns JSON for unknown API routes and sanitizes internal errors', async () => {
    const app = createApp({ routes: registerTestRoutes });
    const missing = await request(app).get('/api/v1/missing');
    const failure = await request(app).get('/api/v1/unexpected-error');

    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(failure.status).toBe(500);
    expect(failure.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(JSON.stringify(failure.body)).not.toContain(
      'Sensitive internal detail',
    );
    expect(failure.body).not.toHaveProperty('stack');
  });

  it('applies the general rate limit with standard headers', async () => {
    const app = createApp({ rateLimit: { windowMs: 60_000, limit: 1 } });
    const accepted = await request(app).get('/api/v1/health');
    const rejected = await request(app).get('/api/v1/health');

    expect(accepted.status).toBe(200);
    expect(accepted.headers['ratelimit']).toBeDefined();
    expect(rejected.status).toBe(429);
    expect(rejected.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(rejected.body.meta.requestId).toBeDefined();
  });

  it('compresses eligible responses when the client supports gzip', async () => {
    const response = await request(createApp({ routes: registerTestRoutes }))
      .get('/api/v1/large-response')
      .set('accept-encoding', 'gzip');

    expect(response.headers['content-encoding']).toBe('gzip');
  });
});
