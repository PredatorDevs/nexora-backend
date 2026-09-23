import { describe, expect, it, vi } from 'vitest';
import { createPurchaseQuotationsRepository } from '../../../src/modules/purchase-quotations/purchase-quotations.repository.js';

describe('purchase quotations repository', () => {
  it('creates request link details explicitly with their company and parent', async () => {
    const client = {
      purchaseQuotation: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseQuotationRequest: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: 90 }),
        count: vi.fn(),
      },
      purchaseQuotationRequestDetail: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      purchaseRequest: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const repository = createPurchaseQuotationsRepository(client);
    repository.find = vi.fn().mockResolvedValue({ id: 4 });
    const links = [
      {
        purchaseQuotationDetailId: 40,
        purchaseRequestDetailId: 70,
        quantity: 5,
      },
      {
        purchaseQuotationDetailId: 41,
        purchaseRequestDetailId: 71,
        quantity: 8,
      },
    ];

    await repository.replaceRequestLinks(
      6,
      4,
      new Date('2026-09-23T10:00:00.000Z'),
      links,
      [
        { id: 70, purchaseRequestId: 2 },
        { id: 71, purchaseRequestId: 2 },
      ],
      client,
    );

    expect(client.purchaseQuotationRequest.create).toHaveBeenCalledWith({
      data: {
        companyId: 6,
        purchaseQuotationId: 4,
        purchaseRequestId: 2,
      },
      select: { id: true },
    });
    expect(
      client.purchaseQuotationRequestDetail.createMany,
    ).toHaveBeenCalledWith({
      data: links.map((link) => ({
        companyId: 6,
        purchaseQuotationRequestId: 90,
        ...link,
      })),
    });
  });
});
