import { Prisma } from '@prisma/client';
import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { businessCodeEntities, generateBusinessCode } from '../../core/code-generation/business-code.js';
import { paginationMeta } from '../../core/validation/pagination.js';

const d = (value) => new Prisma.Decimal(value ?? 0);
const qty = (value) => d(value).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
const money = (value) => d(value).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
const invalid = (message, statusCode = 409) => new AppError({ code: errorCodes.validation, message, statusCode });
const missing = (subject = 'ajuste') => new AppError({ code: errorCodes.notFound, message: `No se encontró el ${subject} solicitado.`, statusCode: 404 });

export function createInventoryAdjustmentsService({ repository, runInTransaction, generateCode = generateBusinessCode }) {
  const get = async (companyId, id, client) => {
    const value = await repository.find(companyId, id, client);
    if (!value) throw missing();
    return value;
  };
  const updateCost = async (companyId, productId, direction, amount, unitCost, client) => {
    const current = await repository.lockCostAverage(companyId, productId, client);
    const deltaValue = money(amount.mul(unitCost));
    const nextQuantity = qty(direction === 'IN' ? d(current.quantityOnHand).add(amount) : d(current.quantityOnHand).sub(amount));
    const nextValue = money(direction === 'IN' ? d(current.inventoryValue).add(deltaValue) : d(current.inventoryValue).sub(deltaValue));
    if (nextQuantity.lessThan(0) || nextValue.lessThan(0)) throw invalid('El ajuste produciría una existencia o valoración global negativa.');
    await repository.updateCostAverage(companyId, productId, {
      quantityOnHand: nextQuantity, inventoryValue: nextValue,
      averageUnitCost: nextQuantity.isZero() ? d(0) : money(nextValue.div(nextQuantity)),
    }, client);
    return deltaValue;
  };
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return { adjustments: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    get,
    async create(companyId, input, context) {
      return runInTransaction(async (client) => {
        if (!await repository.findWarehouse(companyId, input.warehouseId, client)) throw invalid('El almacén seleccionado no existe o está inactivo.', 404);
        const details = [];
        for (const [index, item] of input.details.entries()) {
          const [lot, location] = await Promise.all([
            repository.findLot(companyId, item.inventoryLotId, client),
            repository.findLocation(companyId, item.locationId, client),
          ]);
          if (!lot || lot.status !== 'AVAILABLE') throw invalid(`El lote de la línea ${index + 1} no está disponible.`);
          if (!location || location.warehouseId !== input.warehouseId) throw invalid(`La ubicación de la línea ${index + 1} no pertenece al almacén seleccionado.`);
          details.push({ companyId, lineNumber: index + 1, ...item, quantity: qty(item.quantity), notes: item.notes ?? null });
        }
        return repository.create({
          companyId, warehouseId: input.warehouseId,
          code: await generateCode(client, businessCodeEntities.inventoryAdjustment, { companyId }),
          reason: input.reason, notes: input.notes ?? null, createdByUserId: context.actorUserId, details,
        }, client);
      });
    },
    async approve(companyId, id, input, context) {
      return runInTransaction(async (client) => {
        const adjustment = await repository.lock(companyId, id, client);
        if (!adjustment) throw missing();
        if (adjustment.status !== 'DRAFT') throw invalid('Solo un ajuste en borrador puede aprobarse.');
        if (adjustment.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) throw invalid('El ajuste cambió mientras se procesaba. Actualiza la pantalla e inténtalo nuevamente.');
        for (const detail of adjustment.details) {
          const amount = qty(detail.quantity);
          const current = await repository.lockCostAverage(companyId, detail.inventoryLot.productId, client);
          const unitCost = money(d(current.averageUnitCost).greaterThan(0) ? current.averageUnitCost : detail.inventoryLot.unitCost);
          if (detail.direction === 'OUT') {
            const changed = await repository.decrementBalance(companyId, detail.inventoryLotId, detail.locationId, amount, client);
            if (changed.count !== 1) throw invalid(`No hay existencia suficiente para aprobar la línea ${detail.lineNumber}.`);
          } else await repository.incrementBalance(companyId, detail.inventoryLotId, detail.locationId, amount, client);
          const totalCost = await updateCost(companyId, detail.inventoryLot.productId, detail.direction, amount, unitCost, client);
          await repository.updateDetail(detail.id, { unitCost, totalCost }, client);
          await repository.createMovement({
            companyId, productId: detail.inventoryLot.productId, inventoryLotId: detail.inventoryLotId,
            warehouseId: adjustment.warehouseId, locationId: detail.locationId,
            movementType: detail.direction === 'IN' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT', movementDate: new Date(),
            quantityIn: detail.direction === 'IN' ? amount : d(0), quantityOut: detail.direction === 'OUT' ? amount : d(0),
            unitCost, totalCost, referenceType: 'ADJUSTMENT', referenceId: adjustment.id,
            reason: adjustment.reason, confirmedByUserId: context.actorUserId,
          }, client);
        }
        const changed = await repository.transition(companyId, id, new Date(input.expectedUpdatedAt), 'DRAFT', {
          status: 'APPROVED', approvedAt: new Date(), approvedByUserId: context.actorUserId,
        }, client);
        if (changed.count !== 1) throw invalid('El ajuste cambió mientras se procesaba. Actualiza la pantalla e inténtalo nuevamente.');
        return get(companyId, id, client);
      });
    },
    async cancel(companyId, id, input, context) {
      return runInTransaction(async (client) => {
        const changed = await repository.transition(companyId, id, new Date(input.expectedUpdatedAt), 'DRAFT', {
          status: 'CANCELLED', cancelledAt: new Date(), cancelledByUserId: context.actorUserId, cancellationReason: input.reason,
        }, client);
        if (changed.count !== 1) throw invalid('Solo un ajuste en borrador y sin cambios concurrentes puede cancelarse.');
        return get(companyId, id, client);
      });
    },
    async reverseMovement(companyId, id, input, context) {
      return runInTransaction(async (client) => {
        const movement = await repository.lockMovement(companyId, id, client);
        if (!movement) throw missing('movimiento');
        if (!['ADJUSTMENT_IN', 'ADJUSTMENT_OUT'].includes(movement.movementType)) throw invalid('En este corte solo pueden revertirse movimientos de ajuste.');
        if (movement.reversalOfMovementId || movement.reversals.length) throw invalid('El movimiento ya es una reversión o ya fue revertido.');
        const originalDirection = movement.movementType === 'ADJUSTMENT_IN' ? 'IN' : 'OUT';
        const reverseDirection = originalDirection === 'IN' ? 'OUT' : 'IN';
        const amount = qty(originalDirection === 'IN' ? movement.quantityIn : movement.quantityOut);
        if (reverseDirection === 'OUT') {
          const changed = await repository.decrementBalance(companyId, movement.inventoryLotId, movement.locationId, amount, client);
          if (changed.count !== 1) throw invalid('No hay existencia suficiente para revertir este movimiento.');
        } else await repository.incrementBalance(companyId, movement.inventoryLotId, movement.locationId, amount, client);
        await updateCost(companyId, movement.productId, reverseDirection, amount, money(movement.unitCost), client);
        const reversal = await repository.createMovement({
          companyId, productId: movement.productId, inventoryLotId: movement.inventoryLotId,
          warehouseId: movement.warehouseId, locationId: movement.locationId,
          movementType: 'REVERSAL', movementDate: new Date(),
          quantityIn: reverseDirection === 'IN' ? amount : d(0), quantityOut: reverseDirection === 'OUT' ? amount : d(0),
          unitCost: movement.unitCost, totalCost: movement.totalCost,
          referenceType: 'ADJUSTMENT', referenceId: movement.referenceId,
          reversalOfMovementId: movement.id, reason: input.reason, confirmedByUserId: context.actorUserId,
        }, client);
        return { ...reversal, id: reversal.id.toString(), reversalOfMovementId: reversal.reversalOfMovementId.toString() };
      });
    },
  };
}

