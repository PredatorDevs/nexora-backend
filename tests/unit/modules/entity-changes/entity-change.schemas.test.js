import { describe, expect, it } from 'vitest';

import { entityChangeListQuery } from '../../../../src/modules/entity-changes/entity-change.schemas.js';

describe('entity change query schema', () => {
  it('parses ISO timestamps into Date values', () => {
    const result = entityChangeListQuery.parse({
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-24T00:00:00.000Z',
    });

    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });

  it('rejects ranges over 90 days and entity IDs without a type', () => {
    expect(
      entityChangeListQuery.safeParse({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-07-24T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(entityChangeListQuery.safeParse({ entityId: '42' }).success).toBe(
      false,
    );
  });
});
