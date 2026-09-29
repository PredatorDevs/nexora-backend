import { describe, expect, it, vi } from 'vitest';
import { createPurchaseOrdersController } from '../../../src/modules/purchase-orders/purchase-orders.controller.js';

describe('purchase orders controller', () => {
  it('passes the expense body and context in the create service signature', async () => {
    const body = {
      expenseTypeId: 4,
      description: 'Flete definitivo',
      amount: 25,
      isCostable: true,
      expectedOrderUpdatedAt: '2026-09-29T12:00:00.000Z',
    };
    const created = { id: 10, expenses: [] };
    const service = { createExpense: vi.fn().mockResolvedValue(created) };
    const controller = createPurchaseOrdersController(service);
    const request = {
      id: 'request-id',
      auth: { userId: 9 },
      tenant: { companyId: 6, membershipId: 12 },
      validated: { params: { id: 10 }, body },
    };
    const response = {
      req: request,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await controller.createExpense(request, response);

    expect(service.createExpense).toHaveBeenCalledWith(6, 10, body, {
      actorUserId: 9,
      requestId: 'request-id',
      companyId: 6,
      membershipId: 12,
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: created }),
    );
  });
});
