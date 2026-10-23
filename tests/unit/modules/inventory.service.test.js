import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createInventoryService } from '../../../src/modules/inventory/inventory.service.js';

const d = (value) => new Prisma.Decimal(value);
const purchase = (overrides = {}) => ({
  id: 9,
  code: 'C-000009',
  companyId: 3,
  warehouseId: 7,
  status: 'VERIFIED',
  costingMode: 'DIRECT',
  purchaseDate: new Date('2026-10-20T12:00:00.000Z'),
  updatedAt: new Date('2026-10-21T12:00:00.000Z'),
  exchangeRate: d(1),
  supplier: { id: 2, code: 'SUP-1', name: 'Proveedor' },
  warehouse: { id: 7, code: 'WH-1', name: 'Principal' },
  retaceos: [],
  details: [{
    id: 15,
    lineNumber: 1,
    productId: 4,
    productUnitId: 11,
    quantityReceived: d(2),
    subtotal: d(20),
    productUnit: { id: 11, code: 'CAJ', name: 'Caja' },
    product: {
      id: 4,
      internalCode: 'PRD-000004',
      name: 'Producto',
      purchaseUnitId: 11,
      saleUnitId: 12,
      purchaseToSaleFactor: d(6),
      saleUnit: { id: 12, code: 'U', name: 'Unidad' },
    },
  }],
  ...overrides,
});

function setup(value) {
  const repository = {
    eligibleReceipts: vi.fn().mockResolvedValue([value]),
    findReceipt: vi.fn().mockResolvedValue(value),
    createLot: vi.fn().mockImplementation(async (data) => ({ id: 31, ...data })),
    createMovement: vi.fn().mockResolvedValue({ id: 41n }),
    lockCostAverage: vi.fn().mockResolvedValue({
      quantityOnHand: d(8), inventoryValue: d(24), averageUnitCost: d(3),
    }),
    updateCostAverage: vi.fn().mockResolvedValue({}),
  };
  const service = createInventoryService({
    repository,
    runInTransaction: (operation) => operation({ transaction: true }),
    generateCode: vi.fn().mockResolvedValue('LOT-000001'),
  });
  return { repository, service };
}

describe('inventory service', () => {
  it('posts a direct receipt in the stock unit and updates weighted cost', async () => {
    const { repository, service } = setup(purchase());
    const result = await service.postReceipt(3, 9, {
      expectedUpdatedAt: '2026-10-21T12:00:00.000Z',
    }, { actorUserId: 5 });

    expect(result.lots).toHaveLength(1);
    expect(repository.createLot).toHaveBeenCalledWith(expect.objectContaining({
      code: 'LOT-000001', stockQuantity: d(12), totalCost: d(20),
      unitCost: d('1.666667'), stockUnitId: 12, status: 'AVAILABLE',
    }), expect.anything());
    expect(repository.createMovement).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'PURCHASE_RECEIPT', quantityIn: d(12), referenceId: 9,
    }), expect.anything());
    expect(repository.updateCostAverage).toHaveBeenCalledWith(3, 4, {
      quantityOnHand: d(20), inventoryValue: d(44), averageUnitCost: d(2.2),
    }, expect.anything());
  });

  it('blocks imported receipts until their retaceo is closed', async () => {
    const { service } = setup(purchase({ costingMode: 'LANDED_COST' }));
    await expect(service.postReceipt(3, 9, {
      expectedUpdatedAt: '2026-10-21T12:00:00.000Z',
    }, { actorUserId: 5 })).rejects.toMatchObject({
      message: expect.stringContaining('retaceo cerrado'),
    });
  });

  it('uses the landed cost of the closed retaceo', async () => {
    const value = purchase({
      costingMode: 'LANDED_COST',
      retaceos: [{
        id: 2, code: 'RTC-000002', status: 'CLOSED',
        details: [{ purchaseDetailId: 15, totalCost: d(36), unitCost: d(18) }],
      }],
    });
    const { repository, service } = setup(value);
    await service.postReceipt(3, 9, {
      expectedUpdatedAt: '2026-10-21T12:00:00.000Z',
    }, { actorUserId: 5 });
    expect(repository.createLot).toHaveBeenCalledWith(expect.objectContaining({
      totalCost: d(36), unitCost: d(3),
    }), expect.anything());
  });

  it('marks an already posted receipt as unavailable', async () => {
    const value = purchase({ details: [] });
    const { service } = setup(value);
    const [item] = await service.eligibleReceipts(3, {});
    expect(item).toMatchObject({ eligible: false, pendingLines: 0 });
  });
});
