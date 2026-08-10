import { describe, expect, it, vi } from 'vitest';

import { createAuthService } from '../../../src/modules/auth/auth.service.js';

const user = {
  id: 1,
  email: 'juan@example.test',
  passwordHash: 'hash',
  displayName: 'Juan',
  status: 'ACTIVE',
  securityVersion: 3,
  mustChangePassword: false,
};
const membership = (id, companyId) => ({
  id,
  companyId,
  status: 'ACTIVE',
  securityVersion: 2,
  company: {
    id: companyId,
    code: `COMPANY_${companyId}`,
    legalName: `Company ${companyId}`,
    commercialName: `Company ${companyId}`,
    status: 'ACTIVE',
  },
});

function createService(repository) {
  return createAuthService({
    repository,
    accessTokens: { sign: vi.fn().mockResolvedValue('access-token') },
    refreshTokens: {
      generate: vi.fn().mockReturnValue('refresh-token'),
      hash: vi.fn().mockReturnValue('refresh-hash'),
      matches: vi.fn().mockReturnValue(true),
      parse: vi.fn().mockReturnValue({
        sessionId: 'session-id',
        token: 'refresh-token',
      }),
      serialize: vi.fn().mockReturnValue('refresh-cookie'),
    },
    passwordVerifier: vi.fn().mockResolvedValue(true),
    passwordHasher: vi.fn(),
    refreshTokenExpiresInDays: 1,
    now: () => new Date('2026-08-10T12:00:00.000Z'),
  });
}

describe('multi-company authentication service', () => {
  it('creates a selection session when the user has several companies', async () => {
    const repository = {
      findUserByEmail: vi.fn().mockResolvedValue(user),
      findActiveMemberships: vi
        .fn()
        .mockResolvedValue([membership(10, 100), membership(20, 200)]),
      createSession: vi.fn(),
    };
    const result = await createService(repository).login({
      email: user.email,
      password: 'password',
    });

    expect(result.requiresCompanySelection).toBe(true);
    expect(result.activeMembership).toBeNull();
    expect(result.memberships).toHaveLength(2);
    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: null, membershipId: null }),
    );
  });

  it('selects the only active membership automatically', async () => {
    const repository = {
      findUserByEmail: vi.fn().mockResolvedValue(user),
      findActiveMemberships: vi.fn().mockResolvedValue([membership(10, 100)]),
      createSession: vi.fn(),
    };
    const result = await createService(repository).login({
      email: user.email,
      password: 'password',
    });

    expect(result.requiresCompanySelection).toBe(false);
    expect(result.activeMembership).toMatchObject({ id: 10, companyId: 100 });
    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 100, membershipId: 10 }),
    );
  });

  it('rotates the refresh credential while switching companies', async () => {
    const target = membership(20, 200);
    const repository = {
      findSessionById: vi.fn().mockResolvedValue({
        id: 'session-id',
        familyId: 'session-id',
        userId: 1,
        companyId: 100,
        membershipId: 10,
        refreshTokenHash: 'refresh-hash',
        revokedAt: null,
        expiresAt: new Date('2026-08-11T12:00:00.000Z'),
        user,
      }),
      findActiveMembership: vi.fn().mockResolvedValue(target),
      switchCompany: vi.fn().mockResolvedValue(true),
    };
    const result = await createService(repository).switchCompany({
      userId: 1,
      sessionId: 'session-id',
      companyId: 200,
      refreshCookie: 'refresh-cookie',
    });

    expect(repository.switchCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 200,
        membershipId: 20,
        currentHash: 'refresh-hash',
        nextHash: 'refresh-hash',
      }),
    );
    expect(result.activeMembership).toMatchObject({ companyId: 200 });
    expect(result.refreshCookie).toBe('refresh-cookie');
  });
});
