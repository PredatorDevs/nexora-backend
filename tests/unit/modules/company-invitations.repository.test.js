import { describe, expect, it, vi } from 'vitest';
import { createCompanyInvitationsRepository } from '../../../src/modules/company-invitations/company-invitations.repository.js';

describe('company invitations repository', () => {
  it('connects invitation roles through their company-scoped identity', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const repository = createCompanyInvitationsRepository({
      companyInvitation: { create },
    });
    await repository.create({
      companyId: 6,
      email: 'invited@example.test',
      roleIds: [22],
      tokenHash: 'a'.repeat(64),
      invitedByUserId: 1,
      expiresAt: new Date('2026-08-24T00:00:00.000Z'),
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roles: {
            create: [
              {
                role: {
                  connect: { id_companyId: { id: 22, companyId: 6 } },
                },
              },
            ],
          },
        }),
      }),
    );
  });

  it('connects membership roles and their assigner without writing derived keys', async () => {
    const create = vi.fn().mockResolvedValue({ id: 2, companyId: 6 });
    const repository = createCompanyInvitationsRepository({
      companyMembership: { create },
    });
    await repository.createMembership(6, 12, [22], 1);
    expect(create).toHaveBeenCalledWith({
      data: {
        companyId: 6,
        userId: 12,
        roles: {
          create: [
            {
              assignedBy: { connect: { id: 1 } },
              role: {
                connect: { id_companyId: { id: 22, companyId: 6 } },
              },
            },
          ],
        },
      },
      select: { id: true, companyId: true },
    });
  });
});
