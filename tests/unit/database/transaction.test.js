import { describe, expect, it, vi } from 'vitest';

import { runInTransaction } from '../../../src/database/transaction.js';

describe('runInTransaction', () => {
  it('uses transaction limits suitable for multi-step business operations', async () => {
    const operation = vi.fn();
    const client = {
      $transaction: vi.fn().mockResolvedValue('result'),
    };

    await expect(runInTransaction(operation, undefined, client)).resolves.toBe(
      'result',
    );
    expect(client.$transaction).toHaveBeenCalledWith(operation, {
      maxWait: 5_000,
      timeout: 30_000,
    });
  });

  it('allows callers to override the default limits', async () => {
    const operation = vi.fn();
    const options = { maxWait: 2_000, timeout: 5_000 };
    const client = {
      $transaction: vi.fn().mockResolvedValue('result'),
    };

    await expect(runInTransaction(operation, options, client)).resolves.toBe(
      'result',
    );
    expect(client.$transaction).toHaveBeenCalledWith(operation, options);
  });
});
