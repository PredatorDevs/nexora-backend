import { describe, expect, it, vi } from 'vitest';

import { createEntityChangeService } from '../../../../src/modules/entity-changes/entity-change.service.js';

describe('entity change service', () => {
  it('records normalized identity, context, and changed fields', async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: 1n }) };
    const service = createEntityChangeService(repository);

    await service.record(
      {
        schemaName: 'administration',
        entityType: 'user',
        entityId: 42,
        operation: 'UPDATE',
        context: { actorUserId: 7, requestId: 'request-1' },
        oldValues: {
          id: 42,
          status: 'ACTIVE',
          roleCodes: ['VIEWER'],
          updatedAt: '2026-07-24T10:00:00.000Z',
        },
        newValues: {
          id: 42,
          status: 'INACTIVE',
          roleCodes: ['VIEWER'],
          updatedAt: '2026-07-24T11:00:00.000Z',
        },
      },
      'transaction',
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'administration',
        entityType: 'user',
        entityId: '42',
        actorUserId: 7,
        requestId: 'request-1',
        changedFields: ['status'],
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'INACTIVE' },
      }),
      'transaction',
    );
  });

  it('keeps complete safe snapshots for create and delete operations', async () => {
    const repository = { create: vi.fn().mockResolvedValue({ id: 1n }) };
    const service = createEntityChangeService(repository);
    const snapshot = { id: 42, email: 'user@example.test', status: 'ACTIVE' };
    const base = {
      schemaName: 'administration',
      entityType: 'user',
      entityId: 42,
      context: { actorUserId: 7, requestId: 'request-1' },
    };

    await service.record({
      ...base,
      operation: 'CREATE',
      oldValues: null,
      newValues: snapshot,
    });
    await service.record({
      ...base,
      operation: 'DELETE',
      oldValues: snapshot,
      newValues: null,
    });

    expect(repository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ oldValues: null, newValues: snapshot }),
      undefined,
    );
    expect(repository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ oldValues: snapshot, newValues: null }),
      undefined,
    );
  });

  it('does not persist updates that only change technical timestamps', async () => {
    const repository = { create: vi.fn() };
    const service = createEntityChangeService(repository);

    await expect(
      service.record({
        schemaName: 'administration',
        entityType: 'user',
        entityId: 42,
        operation: 'UPDATE',
        context: { actorUserId: 7, requestId: 'request-1' },
        oldValues: {
          id: 42,
          status: 'ACTIVE',
          updatedAt: '2026-07-24T10:00:00.000Z',
        },
        newValues: {
          id: 42,
          status: 'ACTIVE',
          updatedAt: '2026-07-24T11:00:00.000Z',
        },
      }),
    ).resolves.toBeNull();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('uses a bounded default range and omits no pagination metadata', async () => {
    const repository = {
      list: vi.fn().mockResolvedValue({ items: [{ id: 2n }], total: 1 }),
    };
    const service = createEntityChangeService(repository);
    const now = new Date('2026-07-24T12:00:00.000Z');

    const result = await service.list(
      { page: 1, pageSize: 20, schemaName: 'administration' },
      now,
    );

    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        from: new Date('2026-07-17T12:00:00.000Z'),
        to: now,
      }),
    );
    expect(result).toMatchObject({
      changes: [{ id: '2' }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });
});
