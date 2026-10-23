import { Prisma } from '@prisma/client';
import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { businessCodeEntities, generateBusinessCode } from '../../core/code-generation/business-code.js';

const decimal = (value) => new Prisma.Decimal(value ?? 0);
const quantity = (value) => decimal(value).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
const money = (value) => decimal(value).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
const invalid = (message, statusCode = 409, details) =>
  new AppError({ code: errorCodes.validation, message, statusCode, details });
const closedRetaceo = (purchase) => purchase.retaceos?.[0] ?? null;

function readiness(purchase) {
  if (!purchase.details.length)
    return { eligible: false, reason: 'La recepción ya fue ingresada al inventario.' };
  if (purchase.costingMode === 'LANDED_COST' && !closedRetaceo(purchase))
    return { eligible: false, reason: 'La recepción requiere un retaceo cerrado antes de ingresar al inventario.' };
  return { eligible: true, reason: null };
}

function conversionFor(detail) {
  if (detail.productUnitId === detail.product.saleUnitId) return decimal(1);
  if (detail.productUnitId === detail.product.purchaseUnitId)
    return decimal(detail.product.purchaseToSaleFactor);
  throw invalid(`La unidad recibida de ${detail.product.internalCode} no coincide con la unidad de compra ni con la unidad base del producto.`);
}

function lineCost(purchase, detail, retaceoByPurchaseDetail) {
  const source = purchase.costingMode === 'LANDED_COST'
    ? retaceoByPurchaseDetail.get(detail.id)?.totalCost
    : detail.subtotal;
  if (source == null)
    throw invalid(`El retaceo cerrado no contiene el detalle ${detail.lineNumber} de la recepción.`);
  return money(decimal(source).mul(purchase.exchangeRate));
}

export function createInventoryService({ repository, runInTransaction, generateCode = generateBusinessCode }) {
  return {
    async eligibleReceipts(companyId, query) {
      const purchases = await repository.eligibleReceipts(companyId, query);
      return purchases.map((purchase) => ({
        id: purchase.id, code: purchase.code, status: purchase.status,
        costingMode: purchase.costingMode, purchaseDate: purchase.purchaseDate,
        updatedAt: purchase.updatedAt,
        supplierInvoiceNumber: purchase.supplierInvoiceNumber,
        supplier: purchase.supplier, warehouse: purchase.warehouse,
        pendingLines: purchase.details.length, ...readiness(purchase),
        retaceo: closedRetaceo(purchase),
      }));
    },
    async postReceipt(companyId, purchaseId, data, context) {
      return runInTransaction(async (client) => {
        const purchase = await repository.findReceipt(companyId, purchaseId, client);
        if (!purchase) throw new AppError({
          code: errorCodes.notFound, message: 'No se encontró la recepción solicitada.', statusCode: 404,
        });
        if (!['VERIFIED', 'CLOSED'].includes(purchase.status))
          throw invalid('Solo una recepción verificada o cerrada puede ingresar al inventario.');
        if (purchase.updatedAt.toISOString() !== new Date(data.expectedUpdatedAt).toISOString())
          throw invalid('La recepción cambió mientras se procesaba. Actualiza la pantalla e inténtalo nuevamente.');
        const ready = readiness(purchase);
        if (!ready.eligible) throw invalid(ready.reason);

        const retaceoByPurchaseDetail = new Map(
          (closedRetaceo(purchase)?.details ?? []).map((item) => [item.purchaseDetailId, item]),
        );
        const createdLots = [];
        for (const detail of purchase.details) {
          const factor = conversionFor(detail);
          const stockQuantity = quantity(decimal(detail.quantityReceived).mul(factor));
          if (stockQuantity.lessThanOrEqualTo(0))
            throw invalid(`La cantidad base del detalle ${detail.lineNumber} debe ser mayor que cero.`);
          const totalCost = lineCost(purchase, detail, retaceoByPurchaseDetail);
          const unitCost = money(totalCost.div(stockQuantity));
          const lot = await repository.createLot({
            companyId,
            code: await generateCode(client, businessCodeEntities.inventoryLot, { companyId }),
            productId: detail.productId, purchaseDetailId: detail.id,
            receivedUnitId: detail.productUnitId, stockUnitId: detail.product.saleUnitId,
            receivedQuantity: detail.quantityReceived, conversionFactor: factor,
            stockQuantity, unitCost, totalCost, receivedAt: purchase.purchaseDate,
            status: 'AVAILABLE', createdByUserId: context.actorUserId,
          }, client);
          await repository.createMovement({
            companyId, productId: detail.productId, inventoryLotId: lot.id,
            warehouseId: purchase.warehouseId, movementType: 'PURCHASE_RECEIPT',
            movementDate: purchase.purchaseDate, quantityIn: stockQuantity,
            quantityOut: decimal(0), unitCost, totalCost,
            referenceType: 'PURCHASE', referenceId: purchase.id,
            reason: `Ingreso por recepción ${purchase.code}`,
            confirmedByUserId: context.actorUserId,
          }, client);
          const current = await repository.lockCostAverage(companyId, detail.productId, client);
          const newQuantity = quantity(decimal(current.quantityOnHand).add(stockQuantity));
          const newValue = money(decimal(current.inventoryValue).add(totalCost));
          await repository.updateCostAverage(companyId, detail.productId, {
            quantityOnHand: newQuantity, inventoryValue: newValue,
            averageUnitCost: money(newValue.div(newQuantity)),
          }, client);
          createdLots.push(lot);
        }
        return { purchaseId: purchase.id, purchaseCode: purchase.code, lots: createdLots };
      });
    },
  };
}
