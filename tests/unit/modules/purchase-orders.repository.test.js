import { describe, expect, it, vi } from 'vitest';
import { createPurchaseOrdersRepository } from '../../../src/modules/purchase-orders/purchase-orders.repository.js';

describe('purchase orders repository', () => {
  it('creates company-scoped order details and expenses explicitly', async () => {
    const client = {
      purchaseOrder: {
        create: vi.fn().mockResolvedValue({ id: 25 }),
      },
      purchaseOrderDetail: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseOrderExpense: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const repository = createPurchaseOrdersRepository(client);
    repository.find = vi.fn().mockResolvedValue({ id: 25 });
    const detail = { companyId: 6, lineNumber: 1, quantity: 5 };
    const expense = { companyId: 6, lineNumber: 1, amount: 10 };

    await repository.create(
      {
        companyId: 6,
        code: 'OC-000001',
        details: { create: [detail] },
        expenses: { create: [expense] },
      },
      client,
    );

    expect(client.purchaseOrder.create).toHaveBeenCalledWith({
      data: { companyId: 6, code: 'OC-000001' },
      select: { id: true },
    });
    expect(client.purchaseOrderDetail.createMany).toHaveBeenCalledWith({
      data: [{ ...detail, purchaseOrderId: 25 }],
    });
    expect(client.purchaseOrderExpense.createMany).toHaveBeenCalledWith({
      data: [{ ...expense, purchaseOrderId: 25 }],
    });
  });
});
