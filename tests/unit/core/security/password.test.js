import { describe, expect, it } from 'vitest';

import {
  hashPassword,
  verifyPassword,
} from '../../../../src/core/security/password.js';

describe('password security', () => {
  it('hashes with Argon2id and verifies without exposing the password', async () => {
    const hash = await hashPassword('a-strong-test-password');

    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, 'a-strong-test-password')).resolves.toBe(
      true,
    );
    await expect(verifyPassword(hash, 'incorrect-password')).resolves.toBe(
      false,
    );
    expect(hash).not.toContain('a-strong-test-password');
  });
});
