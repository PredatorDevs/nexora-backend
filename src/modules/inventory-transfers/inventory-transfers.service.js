import { Prisma } from '@prisma/client';
import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { businessCodeEntities, generateBusinessCode } from '../../core/code-generation/business-code.js';
import { paginationMeta } from '../../core/validation/pagination.js';

const d = (value) => new Prisma.Decimal(value ?? 0);
const qty = (value) => d(value).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
const money = (value) => d(value).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
const invalid = (message, statusCode = 409) => new AppError({ code: errorCodes.validation, message, statusCode });
const missing = () => new AppError({ code: errorCodes.notFound, message: 'No se encontró el traslado solicitado.', statusCode: 404 });

export function createInventoryTransfersService({ repository, runInTransaction, generateCode = generateBusinessCode }) {
  const get = async (companyId, id, client) => {
    const value = await repository.find(companyId, id, client);
    if (!value) throw missing();
    return value;
  };
  const change = async (companyId, id, input, from, data, client) => {
    const result = await repository.transition(companyId, id, new Date(input.expectedUpdatedAt), from, data, client);
    if (result.count !== 1) throw invalid('El traslado cambió mientras se procesaba. Actualiza la pantalla e inténtalo nuevamente.');
    return get(companyId, id, client);
  };
  return {
    async list(companyId, query) {
      const result = await repository.list(companyId, query);
      return { transfers: result.items, pagination: paginationMeta({ ...query, total: result.total }) };
    },
    get,
    async create(companyId, input, context) {
      return runInTransaction(async (client) => {
        if (!await repository.findWarehouse(companyId, input.sourceWarehouseId, client) ||
            !await repository.findWarehouse(companyId, input.destinationWarehouseId, client))
          throw invalid('Los almacenes de origen y destino deben existir y estar activos.', 404);
        const details = [];
        const requestedBySource = new Map();
        for (const [index, item] of input.details.entries()) {
          const source = await repository.findLocationBalance(companyId, item.inventoryLotId, item.sourceLocationId, client);
          const destination = await repository.findLocation(companyId, item.destinationLocationId, client);
          if (!source || !destination) throw invalid(`Las ubicaciones de la línea ${index + 1} no son válidas.`, 404);
          if (!source.location.isActive || source.location.warehouseId !== input.sourceWarehouseId)
            throw invalid(`La ubicación origen de la línea ${index + 1} no pertenece al almacén origen.`);
          if (destination.warehouseId !== input.destinationWarehouseId)
            throw invalid(`La ubicación destino de la línea ${index + 1} no pertenece al almacén destino.`);
          if (source.inventoryLot.status !== 'AVAILABLE') throw invalid(`El lote de la línea ${index + 1} no está disponible.`);
          const amount = qty(item.quantity);
          const sourceKey = `${item.inventoryLotId}:${item.sourceLocationId}`;
          const accumulated = qty(d(requestedBySource.get(sourceKey)).add(amount));
          if (accumulated.greaterThan(source.quantity))
            throw invalid(`Las líneas del lote seleccionado exceden la existencia disponible en la ubicación origen.`);
          requestedBySource.set(sourceKey, accumulated);
          details.push({
            companyId, lineNumber: index + 1, inventoryLotId: item.inventoryLotId,
            sourceLocationId: item.sourceLocationId, destinationLocationId: item.destinationLocationId,
            quantity: amount, unitCost: source.inventoryLot.unitCost,
            totalCost: money(amount.mul(source.inventoryLot.unitCost)), notes: item.notes ?? null,
          });
        }
        return repository.create({
          companyId, code: await generateCode(client, businessCodeEntities.inventoryTransfer, { companyId }),
          sourceWarehouseId: input.sourceWarehouseId,
          destinationWarehouseId: input.destinationWarehouseId,
          notes: input.notes ?? null, createdByUserId: context.actorUserId, details,
        }, client);
      });
    },
    async dispatch(companyId, id, input, context) {
      return runInTransaction(async (client) => {
        const transfer = await get(companyId, id, client);
        if (transfer.status !== 'PREPARATION') throw invalid('Solo un traslado en preparación puede despacharse.');
        for (const detail of transfer.details) {
          const updated = await repository.decrementBalance(companyId, detail.inventoryLotId, detail.sourceLocationId, detail.quantity, client);
          if (updated.count !== 1) throw invalid(`No hay existencia suficiente para despachar la línea ${detail.lineNumber}.`);
          await repository.createMovement({
            companyId, productId: detail.inventoryLot.productId, inventoryLotId: detail.inventoryLotId,
            warehouseId: transfer.sourceWarehouseId, locationId: detail.sourceLocationId,
            movementType: 'TRANSFER_OUT', movementDate: new Date(),
            quantityIn: d(0), quantityOut: detail.quantity,
            unitCost: detail.unitCost, totalCost: detail.totalCost,
            referenceType: 'TRANSFER', referenceId: transfer.id,
            reason: `Despacho de traslado ${transfer.code}`, confirmedByUserId: context.actorUserId,
          }, client);
        }
        return change(companyId, id, input, ['PREPARATION'], {
          status: 'IN_TRANSIT', dispatchedAt: new Date(), dispatchedByUserId: context.actorUserId,
        }, client);
      });
    },
    async receive(companyId, id, input, context) {
      return runInTransaction(async (client) => {
        const transfer = await get(companyId, id, client);
        if (!['IN_TRANSIT', 'INCIDENT'].includes(transfer.status))
          throw invalid('Solo un traslado en tránsito o con incidencia puede recibirse.');
        for (const detail of transfer.details) {
          await repository.incrementBalance(companyId, detail.inventoryLotId, detail.destinationLocationId, detail.quantity, client);
          await repository.createMovement({
            companyId, productId: detail.inventoryLot.productId, inventoryLotId: detail.inventoryLotId,
            warehouseId: transfer.destinationWarehouseId, locationId: detail.destinationLocationId,
            movementType: 'TRANSFER_IN', movementDate: new Date(),
            quantityIn: detail.quantity, quantityOut: d(0),
            unitCost: detail.unitCost, totalCost: detail.totalCost,
            referenceType: 'TRANSFER', referenceId: transfer.id,
            reason: `Recepción de traslado ${transfer.code}`, confirmedByUserId: context.actorUserId,
          }, client);
        }
        return change(companyId, id, input, ['IN_TRANSIT', 'INCIDENT'], {
          status: 'RECEIVED', receivedAt: new Date(), receivedByUserId: context.actorUserId,
        }, client);
      });
    },
    incident(companyId, id, input) {
      return runInTransaction((client) => change(companyId, id, input, ['IN_TRANSIT'], {
        status: 'INCIDENT', incidentNotes: input.reason,
      }, client));
    },
    cancel(companyId, id, input, context) {
      return runInTransaction((client) => change(companyId, id, input, ['PREPARATION'], {
        status: 'CANCELLED', cancelledAt: new Date(), cancelledByUserId: context.actorUserId,
        cancellationReason: input.reason,
      }, client));
    },
  };
}
