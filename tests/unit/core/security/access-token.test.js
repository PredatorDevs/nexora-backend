import { describe, expect, it } from 'vitest';

import { createAccessTokenService } from '../../../../src/core/security/access-token.js';

const options = {
  secret: 'a-test-secret-that-is-longer-than-32-characters',
  expiresIn: '10m',
  issuer: 'test-issuer',
  audience: 'test-audience',
};

describe('access token service', () => {
  it('signs and verifies the minimal authority claims', async () => {
    const service = createAccessTokenService(options);
    const token = await service.sign({
      userId: 12,
      sessionId: 'session-id',
      securityVersion: 3,
    });

    await expect(service.verify(token)).resolves.toEqual({
      userId: 12,
      sessionId: 'session-id',
      securityVersion: 3,
    });
  });

  it('rejects tokens signed for another audience', async () => {
    const signer = createAccessTokenService(options);
    const verifier = createAccessTokenService({
      ...options,
      audience: 'another-audience',
    });
    const token = await signer.sign({
      userId: 12,
      sessionId: 'session-id',
      securityVersion: 1,
    });

    await expect(verifier.verify(token)).rejects.toBeDefined();
  });
});
