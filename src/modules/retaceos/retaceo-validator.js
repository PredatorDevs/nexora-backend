import { Prisma } from '@prisma/client';

const d = (value) => new Prisma.Decimal(value ?? 0);
const money = (value) => d(value).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);

export class RetaceoValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'RetaceoValidationError';
    this.details = details;
  }
}

const fail = (message, details) => {
  throw new RetaceoValidationError(message, details);
};
const equals = (left, right) => money(left).equals(money(right));

export function validateCalculatedRetaceo(retaceo) {
  if (!retaceo.details?.length) fail('El retaceo no contiene líneas calculadas.');
  if (!retaceo.calculationVersion || !retaceo.calculatedAt || !retaceo.calculatedBy)
    fail('El retaceo no contiene una versión de cálculo completa.');
  if (Boolean(retaceo.importInvoiceNumber) !== Boolean(retaceo.importInvoiceDate))
    fail('El número y la fecha de la factura de importación deben registrarse juntos.');
  if (Boolean(retaceo.importPolicyNumber) !== Boolean(retaceo.importPolicyDate))
    fail('El número y la fecha de la póliza de importación deben registrarse juntos.');

  const totalFob = retaceo.details.reduce((sum, item) => sum.add(item.fobTotal), d(0));
  const capitalizableCosts = retaceo.costs
    .filter((item) => item.isCapitalizable)
    .reduce((sum, item) => sum.add(item.baseAmount), d(0));
  const recoverableTaxes = retaceo.costs
    .filter((item) => item.isRecoverableTax)
    .reduce((sum, item) => sum.add(item.baseAmount), d(0));
  const cifCosts = retaceo.costs
    .filter((item) => item.isCapitalizable && item.isCifComponent)
    .reduce((sum, item) => sum.add(item.baseAmount), d(0));
  const detailTotal = retaceo.details.reduce((sum, item) => sum.add(item.totalCost), d(0));

  const totals = [
    ['FOB', totalFob, retaceo.totalFob],
    ['costos capitalizables', capitalizableCosts, retaceo.totalCapitalizableCosts],
    ['impuestos recuperables', recoverableTaxes, retaceo.totalRecoverableTaxes],
    ['CIF', totalFob.add(cifCosts), retaceo.totalCif],
    ['landed cost', totalFob.add(capitalizableCosts), retaceo.totalLandedCost],
    ['costo final de productos', detailTotal, retaceo.totalLandedCost],
  ];
  for (const [label, expected, actual] of totals)
    if (!equals(expected, actual)) fail(`La cuadratura de ${label} no coincide.`, {
      expected: money(expected).toString(), actual: money(actual).toString(),
    });

  const detailIds = new Set(retaceo.details.map((item) => item.id));
  for (const detail of retaceo.details) {
    if (!equals(d(detail.fobTotal).add(detail.allocatedCapitalizableCost), detail.totalCost))
      fail('El costo total de una línea no coincide con su FOB más costos asignados.', { detailId: detail.id });
    if (d(detail.quantity).lessThanOrEqualTo(0) || d(detail.unitCost).lessThan(0))
      fail('Una línea contiene cantidad o costo unitario inválido.', { detailId: detail.id });
  }

  for (const cost of retaceo.costs) {
    if (cost.category === 'IMPORT_VAT' && cost.isCapitalizable)
      fail('El IVA de importación no puede formar parte del costo.', { costId: cost.id });
    if (cost.isRecoverableTax && cost.isCapitalizable)
      fail('Un impuesto recuperable no puede capitalizarse.', { costId: cost.id });
    const allocations = cost.allocations ?? [];
    if (!cost.isCapitalizable) {
      if (allocations.length) fail('Un costo no capitalizable contiene distribuciones.', { costId: cost.id });
      continue;
    }
    const allocatedIds = new Set(allocations.map((item) => item.retaceoDetailId));
    if (allocations.length !== detailIds.size || allocatedIds.size !== detailIds.size
      || [...allocatedIds].some((id) => !detailIds.has(id)))
      fail('Un costo capitalizable no está distribuido entre todas las líneas.', { costId: cost.id });
    const allocated = allocations.reduce((sum, item) => sum.add(item.allocatedCost), d(0));
    if (!equals(allocated, cost.baseAmount))
      fail('La distribución de un costo no coincide con su importe original.', {
        costId: cost.id, expected: money(cost.baseAmount).toString(), actual: money(allocated).toString(),
      });
  }
  return true;
}
