import { describe, expect, it, vi } from 'vitest';
import { createPurchasesRepository } from '../../../src/modules/purchases/purchases.repository.js';

describe('purchases repository', () => {
  it('creates company-scoped purchase details explicitly', async () => {
    const client = {
      purchase: {
        create: vi.fn().mockResolvedValue({ id: 30 }),
      },
      purchaseDetail: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const repository = createPurchasesRepository(client);
    repository.find = vi.fn().mockResolvedValue({ id: 30 });
    const details = [
      { companyId: 6, lineNumber: 1, quantityReceived: 5 },
      { companyId: 6, lineNumber: 2, quantityReceived: 8 },
    ];

    await repository.create(
      {
        companyId: 6,
        code: 'C-000001',
        details: { create: details },
      },
      client,
    );

    expect(client.purchase.create).toHaveBeenCalledWith({
      data: { companyId: 6, code: 'C-000001' },
      select: { id: true },
    });
    expect(client.purchaseDetail.createMany).toHaveBeenCalledWith({
      data: details.map((detail) => ({ ...detail, purchaseId: 30 })),
    });
  });
});
