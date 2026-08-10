import { describe, expect, it } from 'vitest';

import {
  roleSnapshot,
  userSnapshot,
} from '../../../../src/modules/entity-changes/entity-change.snapshots.js';

describe('entity change snapshots', () => {
  it('keeps the user allowlist free of credentials', () => {
    const snapshot = userSnapshot({
      id: 1,
      email: 'user@example.test',
      displayName: 'User',
      status: 'ACTIVE',
      securityVersion: 2,
      mustChangePassword: false,
      passwordHash: 'must-never-be-recorded',
      refreshTokenHash: 'must-never-be-recorded',
      roles: [{ role: { code: 'VIEWER' } }],
    });

    expect(snapshot).toMatchObject({
      id: 1,
      roleCodes: ['VIEWER'],
    });
    expect(snapshot).not.toHaveProperty('passwordHash');
    expect(snapshot).not.toHaveProperty('refreshTokenHash');
  });

  it('normalizes role permissions into stable sorted codes', () => {
    expect(
      roleSnapshot({
        id: 2,
        code: 'ADMIN',
        permissions: [
          { permission: { code: 'users.update' } },
          { permission: { code: 'users.read' } },
        ],
      }),
    ).toMatchObject({
      id: 2,
      permissionCodes: ['users.read', 'users.update'],
    });
  });
});
