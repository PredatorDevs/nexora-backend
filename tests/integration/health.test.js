import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

describe('GET /api/v1/health', () => {
  it('reports that the API is healthy', async () => {
    const response = await request(createApp()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
      },
      meta: {
        requestId: response.headers['x-request-id'],
      },
    });
  });

  it('applies the configured trust proxy value', () => {
    const app = createApp({ trustProxy: true });

    expect(app.get('trust proxy')).toBe(true);
  });
});
