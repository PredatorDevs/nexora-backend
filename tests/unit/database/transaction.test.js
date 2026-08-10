import { describe, expect, it, vi } from 'vitest';

import { runInTransaction } from '../../../src/database/transaction.js';

describe('runInTransaction', () => {
  it('delegates the operation and options to Prisma', async () => {
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
