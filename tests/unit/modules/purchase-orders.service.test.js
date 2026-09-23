import { describe, expect, it, vi } from 'vitest';
import { createPurchaseOrdersService } from '../../../src/modules/purchase-orders/purchase-orders.service.js';

describe('purchase orders service', () => {
  it('generates an order from an unprocessed award and calculates authoritative totals', async () => {
    const repository = {
      findAwards: vi.fn().mockResolvedValue({
        id: 5,
        branchId: 2,
        warehouseId: 3,
        branch: { status: 'ACTIVE' },
        warehouse: { isActive: true },
        quotationLinks: [{
          purchaseQuotation: {
            id: 7, supplierId: 8, supplierContactId: null, status: 'SELECTED', currencyCode: 'USD', exchangeRate: '1', exchangeRateDate: null, paymentTerms: '30 días', subtotal: '200',
            expenses: [{ expenseTypeId: 4, description: 'Flete', amount: '20' }],
          },
          details: [{
            id: 10, awardedQuantity: '5',
            quotationDetail: { productId: 11, productUnitId: 12, unitPrice: '20', discountRate: '10', taxRate: '13', notes: null },
          }],
        }],
      }),
      create: vi.fn(async (data) => ({ id: 1, ...data })),
      completeRequest: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const service = createPurchaseOrdersService({ repository, runInTransaction: (fn) => fn({}), generateCode: vi.fn().mockResolvedValue('OC-000001') });
    const result = await service.generate(6, { purchaseRequestId: 5, orderDate: '2026-09-22T00:00:00.000Z', expectedDate: '2026-10-01T00:00:00.000Z' }, { actorUserId: 1 });
    expect(result[0].subtotal.toString()).toBe('100');
    expect(result[0].discount.toString()).toBe('10');
    expect(result[0].tax.toString()).toBe('11.7');
    expect(result[0].additionalExpenses.toString()).toBe('9');
    expect(result[0].total.toString()).toBe('110.7');
    expect(repository.completeRequest).toHaveBeenCalledWith(6, 5, {});
  });
});
