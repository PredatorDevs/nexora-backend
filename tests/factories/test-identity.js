import { randomUUID } from 'node:crypto';

export function createTestIdentity(prefix = 'test') {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const technicalPrefix = prefix.replaceAll(/[^a-z0-9]/gi, '_').toUpperCase();
  return {
    suffix,
    email: `${prefix}-${suffix}@example.test`,
    password: `${prefix}-secure-test-password`,
    roleCode: `TEST_${technicalPrefix}_${suffix.toUpperCase()}`,
  };
}
