import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createRetaceosService } from '../../../src/modules/retaceos/retaceos.service.js';

const purchase = (overrides = {}) => ({
  id: 7,
  status: 'VERIFIED',
  supplierId: 3,
  purchaseOrderId: 9,
  currencyCode: 'USD',
  exchangeRate: new Prisma.Decimal(1),
  exchangeRateDate: null,
  retaceo: null,
  details: [{
    id: 11, lineNumber: 1, productId: 21, productUnitId: 31,
    quantityReceived: new Prisma.Decimal(4), subtotal: new Prisma.Decimal(80),
  }],
  purchaseOrder: { expenses: [{
    id: 41, expenseTypeId: 51, description: 'Flete', amount: new Prisma.Decimal(10),
    isCostable: true,
    expenseType: {
      landedCostCategory: 'FREIGHT', defaultAllocationMethod: 'FOB_VALUE',
      isCapitalizable: true, isRecoverableTax: false, isCifComponent: true,
    },
  }] },
  ...overrides,
});

function setup(source = purchase()) {
  const repository = {
    findPurchase: vi.fn().mockResolvedValue(source),
    findCountry: vi.fn().mockResolvedValue({ id: 1 }),
    create: vi.fn().mockImplementation(async (data) => ({
      id: 1, ...data, uuid: 'uuid', status: 'DRAFT', calculationVersion: 0,
      totalCif: new Prisma.Decimal(0), totalCapitalizableCosts: new Prisma.Decimal(0),
      totalRecoverableTaxes: new Prisma.Decimal(0), totalLandedCost: new Prisma.Decimal(0),
      createdAt: new Date(), updatedAt: new Date(),
    })),
  };
  const service = createRetaceosService({
    repository,
    runInTransaction: (operation) => operation({}),
    generateCode: vi.fn().mockResolvedValue('RTC-000001'),
  });
  return { service, repository };
}

describe('retaceos service', () => {
  it('creates detail snapshots and imports final order expenses', async () => {
    const { service, repository } = setup();
    await service.create(6, {
      purchaseId: 7,
      originCountryId: 1,
      retaceoDate: '2026-09-30T12:00:00.000Z',
      includeOrderExpenses: true,
    }, { actorUserId: 2 });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      companyId: 6,
      code: 'RTC-000001',
      totalFob: new Prisma.Decimal(80),
      details: [expect.objectContaining({
        purchaseDetailId: 11,
        fobUnitCost: new Prisma.Decimal(20),
        fobTotal: new Prisma.Decimal(80),
      })],
      costs: [expect.objectContaining({
        purchaseOrderExpenseId: 41,
        category: 'FREIGHT',
        isCapitalizable: true,
      })],
    }), expect.anything());
  });

  it('rejects purchases that have not been verified', async () => {
    const { service, repository } = setup(purchase({ status: 'RECEIVED' }));
    await expect(service.create(6, {
      purchaseId: 7,
      originCountryId: 1,
      retaceoDate: '2026-09-30T12:00:00.000Z',
      includeOrderExpenses: true,
    }, { actorUserId: 2 })).rejects.toMatchObject({ statusCode: 409 });
    expect(repository.create).not.toHaveBeenCalled();
  });
});
