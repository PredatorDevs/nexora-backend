import { Prisma } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/create-app.js';

function appThrowing(error) {
  return createApp({
    routes(app) {
      app.get('/api/v1/database-error', () => {
        throw error;
      });
    },
  });
}

function knownError(code) {
  return new Prisma.PrismaClientKnownRequestError('Database detail', {
    code,
    clientVersion: '7.8.0',
    meta: { target: ['email'] },
  });
}

describe('Prisma error translation', () => {
  it('translates unique conflicts without leaking database details', async () => {
    const response = await request(appThrowing(knownError('P2002'))).get(
      '/api/v1/database-error',
    );

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('RESOURCE_CONFLICT');
    expect(JSON.stringify(response.body)).not.toContain('Database detail');
  });

  it('translates missing records to resource not found', async () => {
    const response = await request(appThrowing(knownError('P2025'))).get(
      '/api/v1/database-error',
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('sanitizes other known database failures', async () => {
    const response = await request(appThrowing(knownError('P2003'))).get(
      '/api/v1/database-error',
    );

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('DATABASE_ERROR');
  });
});
