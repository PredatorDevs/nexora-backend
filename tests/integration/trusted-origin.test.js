import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/create-app.js';
import { sendSuccess } from '../../src/core/http/responses.js';
import { requireTrustedOrigin } from '../../src/core/middleware/trusted-origin.js';

function originApp() {
  return createApp({
    allowedOrigins: ['https://app.example.test'],
    routes(app) {
      app.post(
        '/api/v1/cookie-operation',
        requireTrustedOrigin,
        (_request, response) => sendSuccess(response, null),
      );
    },
  });
}

describe('trusted origin', () => {
  it('rejects missing and untrusted origins for cookie operations', async () => {
    const app = originApp();
    const missing = await request(app).post('/api/v1/cookie-operation');
    const untrusted = await request(app)
      .post('/api/v1/cookie-operation')
      .set('origin', 'https://attacker.example');

    expect(missing.status).toBe(403);
    expect(untrusted.status).toBe(403);
    expect(missing.body.error.code).toBe('FORBIDDEN');
  });

  it('allows an explicitly configured origin', async () => {
    const response = await request(originApp())
      .post('/api/v1/cookie-operation')
      .set('origin', 'https://app.example.test');

    expect(response.status).toBe(200);
  });
});
