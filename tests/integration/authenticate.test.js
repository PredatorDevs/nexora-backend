import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../src/app.js';
import { AppError } from '../../src/core/errors/app-error.js';
import { errorCodes } from '../../src/core/errors/error-codes.js';
import { sendSuccess } from '../../src/core/http/responses.js';
import { authenticate } from '../../src/core/middleware/authenticate.js';

function authenticationApp(authService) {
  return createApp({
    services: { auth: authService },
    routes(app) {
      app.get('/api/v1/protected', authenticate, (request_, response) =>
        sendSuccess(response, request_.auth),
      );
    },
  });
}

describe('authenticate', () => {
  it('rejects missing and malformed bearer credentials', async () => {
    const authService = { authenticate: vi.fn() };
    const app = authenticationApp(authService);
    const missing = await request(app).get('/api/v1/protected');
    const malformed = await request(app)
      .get('/api/v1/protected')
      .set('authorization', 'Basic value');

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(authService.authenticate).not.toHaveBeenCalled();
  });

  it('preserves the public authentication error for an invalid token', async () => {
    const authService = {
      authenticate: vi.fn().mockRejectedValue(
        new AppError({
          code: errorCodes.authenticationRequired,
          message: 'Authentication is required.',
          statusCode: 401,
        }),
      ),
    };
    const response = await request(authenticationApp(authService))
      .get('/api/v1/protected')
      .set('authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(authService.authenticate).toHaveBeenCalledWith('invalid-token');
  });

  it('attaches verified identity to the request', async () => {
    const auth = { userId: 7, sessionId: 'session-id', securityVersion: 2 };
    const authService = { authenticate: vi.fn().mockResolvedValue(auth) };
    const response = await request(authenticationApp(authService))
      .get('/api/v1/protected')
      .set('authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(auth);
  });
});
