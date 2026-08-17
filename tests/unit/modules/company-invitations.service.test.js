import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCompanyInvitationsService } from '../../../src/modules/company-invitations/company-invitations.service.js';
import { hashInvitationToken } from '../../../src/modules/company-invitations/company-invitations.tokens.js';

const now = new Date('2026-08-16T12:00:00.000Z');
const invitation = {
  id: 4,
  companyId: 6,
  email: 'invited@example.test',
  status: 'PENDING',
  expiresAt: new Date('2026-08-20T12:00:00.000Z'),
  company: { id: 6, status: 'ACTIVE', legalName: 'Nexora Test' },
  invitedBy: { id: 1 },
  roles: [{ role: { id: 9, code: 'OPERATOR', name: 'Operator' } }],
};

describe('company invitations service', () => {
  let repository;
  let service;
  beforeEach(() => {
    repository = {
      findCompany: vi.fn().mockResolvedValue({ id: 6 }),
      findRoles: vi.fn().mockResolvedValue([{ id: 9 }]),
      findUser: vi.fn().mockResolvedValue(null),
      findMembership: vi.fn().mockResolvedValue(null),
      revokePending: vi.fn(),
      create: vi.fn().mockImplementation(async (data) => ({ ...invitation, ...data })),
      findByTokenHash: vi.fn().mockResolvedValue(invitation),
      createUser: vi.fn().mockResolvedValue({ id: 12, status: 'ACTIVE' }),
      createMembership: vi.fn().mockResolvedValue({ id: 15, companyId: 6 }),
      accept: vi.fn().mockResolvedValue({ count: 1 }),
    };
    service = createCompanyInvitationsService({
      repository,
      runInTransaction: (operation) => operation({ tx: true }),
      passwordHasher: vi.fn().mockResolvedValue('password-hash'),
      frontendBaseUrl: 'http://localhost:5173',
      exposeLinks: true,
      now: () => now,
    });
  });

  it('issues a seven-day one-time invitation without persisting the raw token', async () => {
    const result = await service.invite(6, { email: invitation.email, roleIds: [9] }, 1);
    expect(result.acceptanceUrl).toContain('/accept-invitation?token=');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/), expiresAt: new Date('2026-08-23T12:00:00.000Z') }),
      { tx: true },
    );
    expect(repository.create.mock.calls[0][0]).not.toHaveProperty('token');
  });

  it('creates an account and membership atomically when accepted', async () => {
    const result = await service.accept('valid-token-value-that-is-long-enough', { displayName: 'Invited User', password: 'a-secure-password' });
    expect(repository.findByTokenHash).toHaveBeenCalledWith(hashInvitationToken('valid-token-value-that-is-long-enough'), { tx: true });
    expect(repository.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: invitation.email, passwordHash: 'password-hash' }), { tx: true });
    expect(repository.createMembership).toHaveBeenCalledWith(6, 12, [9], 1, { tx: true });
    expect(result.membership.id).toBe(15);
  });

  it('does not reveal expired invitations', async () => {
    repository.findByTokenHash.mockResolvedValue({ ...invitation, expiresAt: new Date('2026-08-15T12:00:00.000Z') });
    await expect(service.preview('expired-token-value-that-is-long-enough')).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });
});
