import { Prisma } from '@prisma/client';

const d = (value) => new Prisma.Decimal(value ?? 0);
const money = (value) => d(value).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
const factor = (value) => d(value).toDecimalPlaces(12, Prisma.Decimal.ROUND_HALF_UP);

export class RetaceoCalculationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'RetaceoCalculationError';
    this.details = details;
  }
}

function proportionalBases(method, details, cifByDetail) {
  switch (method) {
    case 'FOB_VALUE': return details.map((item) => d(item.fobTotal));
    case 'QUANTITY': return details.map((item) => d(item.quantity));
    case 'WEIGHT': return details.map((item) => d(item.weight));
    case 'VOLUME': return details.map((item) => d(item.volume));
    case 'CIF_VALUE': return details.map((item) => d(cifByDetail.get(item.id)));
    case 'EQUAL': return details.map(() => d(1));
    default: return null;
  }
}

function distributeProportionally(cost, details, bases) {
  if (['WEIGHT', 'VOLUME'].includes(cost.allocationMethod)
    && bases.some((base) => base.lessThanOrEqualTo(0)))
    throw new RetaceoCalculationError(
      `Todas las líneas deben tener ${cost.allocationMethod === 'WEIGHT' ? 'peso' : 'volumen'} mayor que cero.`,
      { costId: cost.id, allocationMethod: cost.allocationMethod },
    );
  const totalBase = bases.reduce((sum, value) => sum.add(value), d(0));
  if (totalBase.lessThanOrEqualTo(0))
    throw new RetaceoCalculationError('La base de distribución debe ser mayor que cero.', {
      costId: cost.id, allocationMethod: cost.allocationMethod,
    });
  const amount = money(cost.baseAmount);
  let assigned = d(0);
  return details.map((detail, index) => {
    const raw = amount.mul(bases[index]).div(totalBase);
    const regular = money(raw);
    const allocated = index === details.length - 1 ? money(amount.sub(assigned)) : regular;
    assigned = assigned.add(allocated);
    return {
      detail,
      baseValue: bases[index],
      totalBaseValue: totalBase,
      allocationFactor: factor(bases[index].div(totalBase)),
      allocatedCost: allocated,
      roundingAdjustment: money(allocated.sub(regular)),
    };
  });
}

function distributeManually(cost, details, manual) {
  if (!manual)
    throw new RetaceoCalculationError('Debes proporcionar la distribución manual del costo.', { costId: cost.id });
  const byDetail = new Map(manual.allocations.map((item) => [item.retaceoDetailId, money(item.amount)]));
  if (byDetail.size !== details.length || details.some((item) => !byDetail.has(item.id)))
    throw new RetaceoCalculationError('La distribución manual debe incluir cada línea exactamente una vez.', { costId: cost.id });
  const total = [...byDetail.values()].reduce((sum, value) => sum.add(value), d(0));
  const amount = money(cost.baseAmount);
  if (!total.equals(amount))
    throw new RetaceoCalculationError('La distribución manual debe sumar exactamente el costo a distribuir.', {
      costId: cost.id, expected: amount.toString(), received: total.toString(),
    });
  return details.map((detail) => ({
    detail,
    baseValue: byDetail.get(detail.id),
    totalBaseValue: amount,
    allocationFactor: amount.isZero() ? d(0) : factor(byDetail.get(detail.id).div(amount)),
    allocatedCost: byDetail.get(detail.id),
    roundingAdjustment: d(0),
  }));
}

export function calculateRetaceo({ details, costs, manualAllocations = [] }) {
  if (!details.length) throw new RetaceoCalculationError('El retaceo no contiene líneas para calcular.');
  const manualByCost = new Map(manualAllocations.map((item) => [item.retaceoCostId, item]));
  if (manualByCost.size !== manualAllocations.length)
    throw new RetaceoCalculationError('Un costo no puede tener más de una distribución manual.');
  const costsById = new Map(costs.map((item) => [item.id, item]));
  for (const costId of manualByCost.keys()) {
    const cost = costsById.get(costId);
    if (!cost || cost.allocationMethod !== 'MANUAL')
      throw new RetaceoCalculationError('La distribución manual pertenece a un costo inválido.', { costId });
  }

  const allocatedByDetail = new Map(details.map((item) => [item.id, d(0)]));
  const cifByDetail = new Map(details.map((item) => [item.id, money(item.fobTotal)]));
  const allocations = [];
  let totalCapitalizableCosts = d(0);
  let totalRecoverableTaxes = d(0);
  let totalCifCosts = d(0);

  for (const cost of [...costs].sort((a, b) => a.lineNumber - b.lineNumber)) {
    const amount = money(cost.baseAmount);
    if (cost.isRecoverableTax) totalRecoverableTaxes = totalRecoverableTaxes.add(amount);
    if (!cost.isCapitalizable) continue;
    if (cost.category === 'IMPORT_VAT')
      throw new RetaceoCalculationError('El IVA de importación no puede incluirse en el costo del retaceo.', { costId: cost.id });
    if (cost.isRecoverableTax)
      throw new RetaceoCalculationError('Un impuesto recuperable no puede capitalizarse.', { costId: cost.id });

    const rows = cost.allocationMethod === 'MANUAL'
      ? distributeManually(cost, details, manualByCost.get(cost.id))
      : distributeProportionally(cost, details,
          proportionalBases(cost.allocationMethod, details, cifByDetail));
    totalCapitalizableCosts = totalCapitalizableCosts.add(amount);
    if (cost.isCifComponent) totalCifCosts = totalCifCosts.add(amount);
    for (const row of rows) {
      allocatedByDetail.set(row.detail.id, allocatedByDetail.get(row.detail.id).add(row.allocatedCost));
      if (cost.isCifComponent)
        cifByDetail.set(row.detail.id, cifByDetail.get(row.detail.id).add(row.allocatedCost));
      allocations.push({
        retaceoCostId: cost.id,
        retaceoDetailId: row.detail.id,
        allocationMethod: cost.allocationMethod,
        baseValue: row.baseValue,
        totalBaseValue: row.totalBaseValue,
        allocationFactor: row.allocationFactor,
        originalCost: amount,
        allocatedCost: row.allocatedCost,
        roundingAdjustment: row.roundingAdjustment,
      });
    }
  }

  const totalFob = money(details.reduce((sum, item) => sum.add(item.fobTotal), d(0)));
  const calculatedDetails = details.map((item) => {
    const allocatedCapitalizableCost = money(allocatedByDetail.get(item.id));
    const totalCost = money(d(item.fobTotal).add(allocatedCapitalizableCost));
    return {
      id: item.id,
      allocatedCapitalizableCost,
      totalCost,
      unitCost: money(totalCost.div(item.quantity)),
    };
  });
  return {
    allocations,
    details: calculatedDetails,
    totals: {
      totalFob,
      totalCif: money(totalFob.add(totalCifCosts)),
      totalCapitalizableCosts: money(totalCapitalizableCosts),
      totalRecoverableTaxes: money(totalRecoverableTaxes),
      totalLandedCost: money(totalFob.add(totalCapitalizableCosts)),
    },
  };
}
