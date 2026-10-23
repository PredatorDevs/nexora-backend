import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createInventoryAdjustmentsService } from '../../../src/modules/inventory-adjustments/inventory-adjustments.service.js';

const d = (value) => new Prisma.Decimal(value);
const adjustment = (overrides = {}) => ({
  id: 10, companyId: 3, warehouseId: 7, code: 'AJ-000001', status: 'DRAFT',
  reason: 'Conteo físico', updatedAt: new Date('2026-10-23T12:00:00.000Z'),
  details: [{
    id: 11, lineNumber: 1, inventoryLotId: 20, locationId: 30,
    direction: 'OUT', quantity: d(2),
    inventoryLot: { id: 20, productId: 4, unitCost: d(3) },
  }], ...overrides,
});

function setup(value = adjustment()) {
  const repository = {
    find: vi.fn().mockResolvedValue(value), lock: vi.fn().mockResolvedValue(value),
    lockCostAverage: vi.fn().mockResolvedValue({ quantityOnHand: d(10), inventoryValue: d(50), averageUnitCost: d(5) }),
    decrementBalance: vi.fn().mockResolvedValue({ count: 1 }), incrementBalance: vi.fn(),
    updateCostAverage: vi.fn(), updateDetail: vi.fn(), createMovement: vi.fn().mockResolvedValue({ id: 99n, reversalOfMovementId: 98n }),
    transition: vi.fn().mockResolvedValue({ count: 1 }),
    lockMovement: vi.fn(),
  };
  const service = createInventoryAdjustmentsService({ repository, runInTransaction: (operation) => operation({ tx: true }), generateCode: vi.fn() });
  return { repository, service };
}

describe('inventory adjustments service', () => {
  it('approves a stock decrease atomically and values it at current average cost', async () => {
    const { repository, service } = setup();
    await service.approve(3, 10, { expectedUpdatedAt: '2026-10-23T12:00:00.000Z' }, { actorUserId: 5 });
    expect(repository.decrementBalance).toHaveBeenCalledWith(3, 20, 30, d(2), expect.anything());
    expect(repository.updateCostAverage).toHaveBeenCalledWith(3, 4, {
      quantityOnHand: d(8), inventoryValue: d(40), averageUnitCost: d(5),
    }, expect.anything());
    expect(repository.createMovement).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'ADJUSTMENT_OUT', quantityOut: d(2), unitCost: d(5), totalCost: d(10),
    }), expect.anything());
  });

  it('rolls back approval when the location has insufficient stock', async () => {
    const { repository, service } = setup();
    repository.decrementBalance.mockResolvedValue({ count: 0 });
    await expect(service.approve(3, 10, { expectedUpdatedAt: '2026-10-23T12:00:00.000Z' }, { actorUserId: 5 }))
      .rejects.toMatchObject({ message: expect.stringContaining('existencia suficiente') });
    expect(repository.createMovement).not.toHaveBeenCalled();
  });

  it('rejects a second reversal of the same adjustment movement', async () => {
    const { repository, service } = setup();
    repository.lockMovement.mockResolvedValue({
      id: 50n, movementType: 'ADJUSTMENT_IN', reversalOfMovementId: null,
      reversals: [{ id: 51n }],
    });
    await expect(service.reverseMovement(3, 50n, { reason: 'Corrección' }, { actorUserId: 5 }))
      .rejects.toMatchObject({ message: expect.stringContaining('ya fue revertido') });
  });
});
