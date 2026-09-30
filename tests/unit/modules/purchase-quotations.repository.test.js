import { describe, expect, it, vi } from 'vitest';
import { createPurchaseQuotationsRepository } from '../../../src/modules/purchase-quotations/purchase-quotations.repository.js';

describe('purchase quotations repository', () => {
  it('applies supplier, status, quotation date, and validity filters', async () => {
    const client = {
      purchaseQuotation: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const repository = createPurchaseQuotationsRepository(client);
    const dateFrom = new Date('2026-09-01T00:00:00.000Z');
    const dateTo = new Date('2026-09-30T23:59:59.999Z');
    const validUntilFrom = new Date('2026-10-01T00:00:00.000Z');
    const validUntilTo = new Date('2026-10-31T23:59:59.999Z');

    await repository.list(6, {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: 'RECEIVED',
      supplierId: 3,
      dateFrom,
      dateTo,
      validUntilFrom,
      validUntilTo,
      search: 'COT-001',
    });

    expect(client.purchaseQuotation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 6,
          status: 'RECEIVED',
          supplierId: 3,
          quotationDate: { gte: dateFrom, lte: dateTo },
          validUntil: { gte: validUntilFrom, lte: validUntilTo },
        }),
      }),
    );
  });

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
