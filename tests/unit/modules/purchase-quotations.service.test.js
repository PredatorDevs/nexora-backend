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

  it('replaces expenses only with active company expense types', async () => {
    const old = {
      id: 4,
      status: 'RECEIVED',
      updatedAt: new Date('2026-09-22T10:00:00.000Z'),
      expenses: [],
      details: [],
      requestLinks: [],
    };
    const repository = {
      find: vi.fn().mockResolvedValue(old),
      findExpenseTypes: vi
        .fn()
        .mockResolvedValue([{ id: 12, isActive: true }]),
      replaceExpenses: vi.fn().mockResolvedValue({
        ...old,
        expenseTotal: '25',
        grandTotal: '125',
      }),
    };
    const service = createPurchaseQuotationsService({
      repository,
      runInTransaction: (operation) => operation({}),
    });

    await service.replaceExpenses(
      6,
      4,
      {
        expectedUpdatedAt: old.updatedAt.toISOString(),
        expenses: [
          { expenseTypeId: 12, description: 'Flete local', amount: 25 },
        ],
      },
      { actorUserId: 1 },
    );

    expect(repository.replaceExpenses).toHaveBeenCalledOnce();
  });

  it('normalizes quotation amounts for comparison using the exchange rate', async () => {
    const repository = {
      findComparison: vi.fn().mockResolvedValue({
        request: {
          id: 5,
          company: { defaultCurrencyCode: 'USD' },
          details: [],
        },
        links: [
          {
            id: 8,
            details: [
              {
                id: 9,
                quotationDetail: { unitPrice: '10', total: '20' },
              },
            ],
            purchaseQuotation: {
              exchangeRate: '2',
              subtotal: '100',
              discount: '5',
              tax: '12.35',
              expenseTotal: '10',
              grandTotal: '117.35',
            },
          },
        ],
      }),
    };
    const service = createPurchaseQuotationsService({ repository });

    const result = await service.comparison(6, 5);

    expect(result.links[0].purchaseQuotation.normalizedGrandTotal.toString()).toBe(
      '234.7',
    );
    expect(result.links[0].details[0].normalizedUnitPrice.toString()).toBe(
      '20',
    );
  });

  it('persists a valid partial award from a quotation under review', async () => {
    const quotation = {
      id: 20,
      status: 'UNDER_REVIEW',
      validUntil: '2026-12-31T00:00:00.000Z',
      exchangeRate: '1',
      subtotal: '100',
      discount: '0',
      tax: '13',
      expenseTotal: '5',
      grandTotal: '118',
      details: [{ id: 30, quantity: '10', availableQuantity: '8' }],
      requestLinks: [
        {
          purchaseRequestId: 5,
          details: [
            { purchaseQuotationDetailId: 30, awardedQuantity: '0' },
          ],
        },
      ],
    };
    const comparison = {
      request: {
        id: 5,
        status: 'IN_QUOTATION',
        updatedAt: new Date('2026-09-22T10:00:00.000Z'),
        company: { defaultCurrencyCode: 'USD' },
        details: [{ id: 40, quantity: '10' }],
      },
      links: [
        {
          id: 50,
          purchaseQuotation: quotation,
          details: [
            {
              id: 60,
              purchaseRequestDetailId: 40,
              purchaseQuotationDetailId: 30,
              quantity: '10',
              awardedQuantity: '0',
              quotationDetail: { unitPrice: '10', total: '113' },
            },
          ],
        },
      ],
    };
    const repository = {
      findComparison: vi.fn().mockResolvedValue(comparison),
      applyDecision: vi.fn().mockResolvedValue(comparison),
    };
    const service = createPurchaseQuotationsService({
      repository,
      runInTransaction: (operation) => operation({}),
    });

    await service.selectAwards(
      6,
      5,
      {
        expectedUpdatedAt: comparison.request.updatedAt.toISOString(),
        reason: 'Mejor plazo de entrega',
        awards: [
          {
            purchaseQuotationRequestDetailId: 60,
            awardedQuantity: 6,
          },
        ],
      },
      { actorUserId: 1 },
    );

    expect(repository.applyDecision).toHaveBeenCalledOnce();
  });
});
