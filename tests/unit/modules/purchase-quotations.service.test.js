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
});
