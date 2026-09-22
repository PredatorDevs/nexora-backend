import { describe, expect, it, vi } from 'vitest';
import { createPurchaseRequestsRepository } from '../../../src/modules/purchase-requests/purchase-requests.repository.js';

describe('purchase requests repository', () => {
  it('lets Prisma derive companyId for nested request details', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const repository = createPurchaseRequestsRepository({
      purchaseRequest: { create },
    });

    await repository.create(6, {
      code: 'PR-000001',
      branchId: 1,
      warehouseId: 3,
      requestedByUserId: 1,
      requiredDate: new Date('2026-09-23T00:00:00.000Z'),
      justification: 'Restock',
      details: [
        {
          productId: 1,
          productUnitId: 1,
          quantity: 1,
          description: null,
          notes: null,
        },
      ],
    });

    const nested = create.mock.calls[0][0].data.details.create[0];
    expect(nested).toMatchObject({
      lineNumber: 1,
      productId: 1,
      productUnitId: 1,
      quantity: 1,
    });
    expect(nested).not.toHaveProperty('companyId');
  });
});
