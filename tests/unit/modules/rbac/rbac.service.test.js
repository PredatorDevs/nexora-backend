import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRbacService } from '../../../../src/modules/rbac/rbac.service.js';

describe('RBAC service', () => {
  let repository;
  let runInTransaction;
  let service;

  beforeEach(() => {
    repository = {
      findPermissionCodesForUser: vi.fn(),
      findPermissionsByCodes: vi.fn(),
      findRoleById: vi.fn(),
      findRolesByIds: vi.fn(),
      findUserWithRoles: vi.fn(),
      countActiveUsersWithRoleCode: vi.fn(),
      replaceRolePermissions: vi.fn(),
      replaceUserRoles: vi.fn(),
      deleteRole: vi.fn(),
      claimRoleVersion: vi.fn().mockResolvedValue({ count: 1 }),
      claimUserVersion: vi.fn().mockResolvedValue({ count: 1 }),
    };
    runInTransaction = vi.fn(async (operation) => operation('transaction'));
    service = createRbacService({ repository, runInTransaction });
  });

  it('resolves effective permissions through the repository', async () => {
    repository.findPermissionCodesForUser.mockResolvedValue(['users.read']);

    await expect(service.hasPermission(10, 'users.read')).resolves.toBe(true);
    await expect(service.getPermissionCodes(10)).resolves.toEqual([
      'users.read',
    ]);
  });

  it('rejects missing permission codes before replacing assignments', async () => {
    repository.findRoleById.mockResolvedValue({ id: 1 });
    repository.findPermissionsByCodes.mockResolvedValue([
      { id: 1, code: 'users.read' },
    ]);

    await expect(
      service.replaceRolePermissions({
        roleId: 1,
        permissionCodes: ['users.read', 'users.update'],
        actorUserId: 2,
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { missingPermissionCodes: ['users.update'] },
    });
    expect(runInTransaction).not.toHaveBeenCalled();
  });

  it('replaces role permissions atomically and removes duplicates', async () => {
    repository.findRoleById.mockResolvedValue({ id: 1 });
    repository.findPermissionsByCodes.mockResolvedValue([
      { id: 3, code: 'users.read' },
    ]);

    await expect(
      service.replaceRolePermissions({
        roleId: 1,
        permissionCodes: ['users.read', 'users.read'],
        actorUserId: 2,
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).resolves.toEqual({ roleId: 1, permissionCodes: ['users.read'] });
    expect(repository.replaceRolePermissions).toHaveBeenCalledWith(
      {
        roleId: 1,
        permissions: [{ id: 3, code: 'users.read' }],
        assignedByUserId: 2,
      },
      'transaction',
    );
  });

  it('prevents users from modifying their own role assignments', async () => {
    repository.findUserWithRoles.mockResolvedValue({ id: 5, roles: [] });

    await expect(
      service.replaceUserRoles({ userId: 5, roleIds: [], actorUserId: 5 }),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT', statusCode: 409 });
  });

  it('preserves the last active super administrator', async () => {
    repository.findUserWithRoles.mockResolvedValue({
      id: 5,
      status: 'ACTIVE',
      roles: [{ role: { id: 1, code: 'SUPER_ADMIN' } }],
    });
    repository.findRolesByIds.mockResolvedValue([]);
    repository.countActiveUsersWithRoleCode.mockResolvedValue(1);

    await expect(
      service.replaceUserRoles({ userId: 5, roleIds: [], actorUserId: 9 }),
    ).rejects.toMatchObject({ code: 'RESOURCE_CONFLICT', statusCode: 409 });
    expect(repository.replaceUserRoles).not.toHaveBeenCalled();
  });

  it('allows removing super admin when another active one remains', async () => {
    repository.findUserWithRoles.mockResolvedValue({
      id: 5,
      status: 'ACTIVE',
      roles: [{ role: { id: 1, code: 'SUPER_ADMIN' } }],
    });
    repository.findRolesByIds.mockResolvedValue([{ id: 2, code: 'ADMIN' }]);
    repository.countActiveUsersWithRoleCode.mockResolvedValue(2);

    await expect(
      service.replaceUserRoles({
        userId: 5,
        roleIds: [2],
        actorUserId: 9,
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).resolves.toEqual({ userId: 5, roleIds: [2] });
  });

  it('protects system roles from deletion', async () => {
    repository.findRoleById.mockResolvedValue({ id: 1, isSystem: true });

    await expect(service.deleteRole(1)).rejects.toMatchObject({
      code: 'RESOURCE_CONFLICT',
      statusCode: 409,
    });
    expect(repository.deleteRole).not.toHaveBeenCalled();
  });

  it('rejects stale role-permission replacement', async () => {
    repository.findRoleById.mockResolvedValue({
      id: 1,
      updatedAt: new Date('2026-07-20T12:01:00.000Z'),
    });
    repository.findPermissionsByCodes.mockResolvedValue([]);
    repository.claimRoleVersion.mockResolvedValue({ count: 0 });

    await expect(
      service.replaceRolePermissions({
        roleId: 1,
        permissionCodes: [],
        actorUserId: 2,
        expectedUpdatedAt: '2026-07-20T12:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      code: 'RESOURCE_CONFLICT',
      details: { reason: 'STALE_WRITE' },
    });
    expect(repository.replaceRolePermissions).not.toHaveBeenCalled();
  });
});
