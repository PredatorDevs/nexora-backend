import { describe, expect, it } from 'vitest';

import {
  generateRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
  parseRefreshCookie,
  serializeRefreshCookie,
} from '../../../../src/core/security/refresh-token.js';

describe('refresh token security', () => {
  it('generates random tokens and stores fixed-length hashes', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first).not.toBe(second);
    expect(hashRefreshToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(matchesRefreshToken(first, hashRefreshToken(first))).toBe(true);
    expect(matchesRefreshToken(second, hashRefreshToken(first))).toBe(false);
  });

  it('serializes and parses the session-bound cookie', () => {
    const sessionId = 'b2161a55-4cc6-434f-ad78-1ee92fabe891';
    const token = generateRefreshToken();

    expect(
      parseRefreshCookie(serializeRefreshCookie(sessionId, token)),
    ).toEqual({ sessionId, token });
    expect(parseRefreshCookie('invalid')).toBeNull();
  });
});
