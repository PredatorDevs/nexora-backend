import { describe, expect, it } from 'vitest';

import { createLogger } from '../../../src/config/logger.js';

describe('createLogger', () => {
  it('redacts credentials, cookies, tokens, and secrets', () => {
    const lines = [];
    const destination = {
      write(line) {
        lines.push(line);
      },
    };
    const logger = createLogger({ level: 'info' }, destination);

    logger.info({
      req: {
        headers: {
          authorization: 'Bearer sensitive-token',
          cookie: 'refresh=sensitive-cookie',
        },
      },
      credentials: {
        password: 'sensitive-password',
        token: 'sensitive-token',
        secret: 'sensitive-secret',
      },
    });

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('sensitive-');
  });
});
