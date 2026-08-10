import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateRefreshToken() {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function matchesRefreshToken(token, expectedHash) {
  const actual = Buffer.from(hashRefreshToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function serializeRefreshCookie(sessionId, token) {
  return `${sessionId}.${token}`;
}

export function parseRefreshCookie(value) {
  if (typeof value !== 'string') return null;
  const separator = value.indexOf('.');
  if (separator < 1) return null;
  const sessionId = value.slice(0, separator);
  const token = value.slice(separator + 1);
  if (!/^[0-9a-f-]{36}$/i.test(sessionId) || token.length < 32) return null;
  return { sessionId, token };
}
