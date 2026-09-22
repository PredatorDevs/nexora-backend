import { describe, expect, it, vi } from 'vitest';
import { createPurchaseQuotationsService } from '../../../src/modules/purchase-quotations/purchase-quotations.service.js';

describe('purchase quotations service', () => {
  it('calculates authoritative line and header totals', async () => {
    const repository = {
      references: vi.fn().mockResolvedValue({
        company: { status: 'ACTIVE', defaultCurrencyCode: 'USD' },
        supplier: { id: 3, isActive: true },
        contact: null,
        products: [{ id: 7, isActive: true, purchaseUnitId: 9, purchaseUnit: { isActive: true, type: 'PURCHASE' } }],
      }),
      create: vi.fn(async (_companyId, data) => ({ id: 1, ...data })),
    };
    const service = createPurchaseQuotationsService({
      repository,
      runInTransaction: (operation) => operation({}),
      generateCode: vi.fn().mockResolvedValue('COT-000001'),
    });

    const result = await service.create(6, {
      supplierId: 3,
      supplierContactId: null,
      quotationDate: '2026-09-22T00:00:00.000Z',
      validUntil: '2026-10-22T00:00:00.000Z',
      currencyCode: 'USD',
      exchangeRate: 99,
      exchangeRateDate: null,
      details: [{ productId: 7, productUnitId: 9, quantity: 10, unitPrice: 20, discountRate: 10, taxRate: 13 }],
    }, { actorUserId: 1 });

    expect(result.subtotal.toString()).toBe('200');
    expect(result.discount.toString()).toBe('20');
    expect(result.tax.toString()).toBe('23.4');
    expect(result.total.toString()).toBe('203.4');
    expect(result.exchangeRate.toString()).toBe('1');
    expect(result.details[0].subtotal.toString()).toBe('180');
  });

  it('links approved request lines with exact product, unit, and quantity coverage', async () => {
    const old = {
      id: 4,
      status: 'DRAFT',
      updatedAt: new Date('2026-09-22T10:00:00.000Z'),
      requestLinks: [],
      details: [
        { id: 40, productId: 7, productUnitId: 9, quantity: '10' },
      ],
    };
    const repository = {
      find: vi.fn().mockResolvedValue(old),
      findLinkReferences: vi.fn().mockResolvedValue({
        quotation: old,
        requestDetails: [
          {
            id: 70,
            purchaseRequestId: 8,
            productId: 7,
            productUnitId: 9,
            quantity: '10',
            purchaseRequest: { status: 'APPROVED' },
          },
        ],
      }),
      replaceRequestLinks: vi.fn().mockResolvedValue({
        ...old,
        requestLinks: [{ purchaseRequestId: 8, details: [] }],
      }),
    };
    const service = createPurchaseQuotationsService({
      repository,
      runInTransaction: (operation) => operation({}),
    });

    await service.replaceRequestLinks(
      6,
      4,
      {
        expectedUpdatedAt: old.updatedAt.toISOString(),
        links: [
          {
            purchaseQuotationDetailId: 40,
            purchaseRequestDetailId: 70,
            quantity: 10,
          },
        ],
      },
      { actorUserId: 1 },
    );

    expect(repository.replaceRequestLinks).toHaveBeenCalledOnce();
  });
});
