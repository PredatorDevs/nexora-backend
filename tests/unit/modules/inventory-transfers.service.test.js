import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createInventoryTransfersService } from '../../../src/modules/inventory-transfers/inventory-transfers.service.js';

const d = (value) => new Prisma.Decimal(value);
const transfer = (status = 'PREPARATION') => ({
  id: 8, code: 'TR-000008', companyId: 3, sourceWarehouseId: 4,
  destinationWarehouseId: 5, status,
  updatedAt: new Date('2026-10-24T12:00:00.000Z'),
  details: [{
    lineNumber: 1, inventoryLotId: 10, sourceLocationId: 20,
    destinationLocationId: 30, quantity: d(4), unitCost: d(2), totalCost: d(8),
    inventoryLot: { productId: 6 },
  }],
});

function setup(value = transfer()) {
  const repository = {
    list: vi.fn().mockResolvedValue({ items: [value], total: 1 }),
    find: vi.fn().mockResolvedValue(value),
    findWarehouse: vi.fn().mockResolvedValue({ id: 1 }),
    findLocationBalance: vi.fn().mockResolvedValue({
      quantity: d(6), location: { warehouseId: 4, isActive: true },
      inventoryLot: { id: 10, productId: 6, unitCost: d(2), status: 'AVAILABLE' },
    }),
    findLocation: vi.fn().mockResolvedValue({ id: 30, warehouseId: 5 }),
    create: vi.fn().mockImplementation(async (data) => ({ id: 8, ...data })),
    transition: vi.fn().mockResolvedValue({ count: 1 }),
    decrementBalance: vi.fn().mockResolvedValue({ count: 1 }),
    incrementBalance: vi.fn().mockResolvedValue({}),
    createMovement: vi.fn().mockResolvedValue({}),
  };
  const service = createInventoryTransfersService({
    repository, runInTransaction: (operation) => operation({ tx: true }),
    generateCode: vi.fn().mockResolvedValue('TR-000008'),
  });
  return { repository, service };
}

describe('inventory transfers service', () => {
  it('creates a preparation transfer with a cost snapshot', async () => {
    const { repository, service } = setup();
    await service.create(3, {
      sourceWarehouseId: 4, destinationWarehouseId: 5,
      details: [{ inventoryLotId: 10, sourceLocationId: 20, destinationLocationId: 30, quantity: 4 }],
    }, { actorUserId: 2 });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      code: 'TR-000008', details: [expect.objectContaining({
        quantity: d(4), unitCost: d(2), totalCost: d(8),
      })],
    }), expect.anything());
  });

  it('dispatches by reducing only the source location', async () => {
    const { repository, service } = setup();
    await service.dispatch(3, 8, { expectedUpdatedAt: '2026-10-24T12:00:00.000Z' }, { actorUserId: 2 });
    expect(repository.decrementBalance).toHaveBeenCalledWith(3, 10, 20, d(4), expect.anything());
    expect(repository.createMovement).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'TRANSFER_OUT', referenceType: 'TRANSFER', quantityOut: d(4),
    }), expect.anything());
  });

  it('receives in transit stock at destination without changing average cost', async () => {
    const { repository, service } = setup(transfer('IN_TRANSIT'));
    await service.receive(3, 8, { expectedUpdatedAt: '2026-10-24T12:00:00.000Z' }, { actorUserId: 2 });
    expect(repository.incrementBalance).toHaveBeenCalledWith(3, 10, 30, d(4), expect.anything());
    expect(repository.createMovement).toHaveBeenCalledWith(expect.objectContaining({
      movementType: 'TRANSFER_IN', quantityIn: d(4), unitCost: d(2),
    }), expect.anything());
    expect(repository.updateCostAverage).toBeUndefined();
  });

  it('relocates stock within one warehouse atomically', async () => {
    const value = transfer();
    value.destinationWarehouseId = 4;
    const { repository, service } = setup(value);
    repository.findLocation.mockResolvedValue({ id: 30, warehouseId: 4 });
    repository.create.mockResolvedValue(value);
    await service.relocate(3, {
      warehouseId: 4, reason: 'Optimización de espacio',
      details: [{ inventoryLotId: 10, sourceLocationId: 20, destinationLocationId: 30, quantity: 4 }],
    }, { actorUserId: 2 });
    expect(repository.decrementBalance).toHaveBeenCalledWith(3, 10, 20, d(4), expect.anything());
    expect(repository.incrementBalance).toHaveBeenCalledWith(3, 10, 30, d(4), expect.anything());
    expect(repository.createMovement).toHaveBeenNthCalledWith(1, expect.objectContaining({ movementType: 'TRANSFER_OUT', quantityOut: d(4) }), expect.anything());
    expect(repository.createMovement).toHaveBeenNthCalledWith(2, expect.objectContaining({ movementType: 'TRANSFER_IN', quantityIn: d(4) }), expect.anything());
    expect(repository.transition).toHaveBeenCalledWith(3, 8, value.updatedAt, ['PREPARATION'], expect.objectContaining({ status: 'RECEIVED' }), expect.anything());
  });
});
