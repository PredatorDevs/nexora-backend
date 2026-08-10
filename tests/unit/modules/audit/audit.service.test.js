import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuditService } from '../../../../src/modules/audit/audit.service.js';

describe('audit service', () => {
  let repository;
  let service;
  const context = {
    requestId: 'request-1',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
  };

  beforeEach(() => {
    repository = { create: vi.fn(), list: vi.fn() };
    service = createAuditService(repository);
  });

  it('records successful operations with resolved identities', async () => {
    repository.create.mockResolvedValue({ id: 1n });

    await expect(
      service.execute(
        {
          action: 'USER.CREATED',
          actorUserId: 2,
          resourceType: 'user',
          resourceId: (user) => user.id,
          context,
        },
        async () => ({ id: 8 }),
      ),
    ).resolves.toEqual({ id: 8 });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER.CREATED',
        actorUserId: 2,
        resourceId: '8',
        result: 'SUCCESS',
      }),
    );
  });

  it('records controlled failure details and preserves the original error', async () => {
    const error = Object.assign(new Error('conflict'), {
      code: 'RESOURCE_CONFLICT',
    });

    await expect(
      service.execute(
        {
          action: 'AUTH.LOGIN_SUCCEEDED',
          failureAction: 'AUTH.LOGIN_FAILED',
          actorUserId: null,
          resourceType: 'auth_session',
          context,
        },
        async () => {
          throw error;
        },
      ),
    ).rejects.toBe(error);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'AUTH.LOGIN_FAILED',
        result: 'FAILURE',
        metadata: { errorCode: 'RESOURCE_CONFLICT' },
      }),
    );
  });

  it('removes secrets from nested metadata', async () => {
    await service.record({
      action: 'TEST',
      actorUserId: 1,
      resourceType: 'test',
      result: 'SUCCESS',
      context,
      metadata: {
        field: 'safe',
        password: 'hidden',
        nested: { accessToken: 'hidden', value: 'safe' },
      },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { field: 'safe', nested: { value: 'safe' } },
      }),
    );
  });

  it('serializes bigint identifiers when listing logs', async () => {
    repository.list.mockResolvedValue({
      items: [{ id: 15n, action: 'USER.CREATED' }],
      total: 1,
    });

    await expect(
      service.list({ page: 1, pageSize: 20 }),
    ).resolves.toMatchObject({
      logs: [{ id: '15', action: 'USER.CREATED' }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });
});
