import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  calculateRetaceo,
  RetaceoCalculationError,
} from '../../../src/modules/retaceos/retaceo-calculator.js';

const d = (value) => new Prisma.Decimal(value);
const detail = (id, fobTotal, quantity = 1, extra = {}) => ({
  id, fobTotal: d(fobTotal), quantity: d(quantity), weight: null, volume: null, ...extra,
});
const cost = (id, amount, extra = {}) => ({
  id, lineNumber: id, baseAmount: d(amount), allocationMethod: 'FOB_VALUE',
  isCapitalizable: true, isRecoverableTax: false, isCifComponent: false, ...extra,
});

describe('retaceo calculator', () => {
  it('distributes capitalizable costs and excludes recoverable taxes', () => {
    const result = calculateRetaceo({
      details: [detail(1, 60, 3), detail(2, 40, 2)],
      costs: [
        cost(1, 10, { isCifComponent: true }),
        cost(2, 3, { allocationMethod: 'EQUAL' }),
        cost(3, 13, { isCapitalizable: false, isRecoverableTax: true }),
      ],
    });
    expect(result.totals.totalFob.toString()).toBe('100');
    expect(result.totals.totalCif.toString()).toBe('110');
    expect(result.totals.totalCapitalizableCosts.toString()).toBe('13');
    expect(result.totals.totalRecoverableTaxes.toString()).toBe('13');
    expect(result.totals.totalLandedCost.toString()).toBe('113');
    expect(result.details.map((item) => item.totalCost.toString())).toEqual(['67.5', '45.5']);
    expect(result.allocations).toHaveLength(4);
  });

  it('assigns the rounding residue deterministically to the last line', () => {
    const result = calculateRetaceo({
      details: [detail(1, 1), detail(2, 1), detail(3, 1)],
      costs: [cost(1, 1, { allocationMethod: 'EQUAL' })],
    });
    expect(result.allocations.map((item) => item.allocatedCost.toString()))
      .toEqual(['0.333333', '0.333333', '0.333334']);
    expect(result.allocations[2].roundingAdjustment.toString()).toBe('0.000001');
  });

  it('requires complete and exact manual allocations', () => {
    const result = calculateRetaceo({
      details: [detail(1, 60), detail(2, 40)],
      costs: [cost(7, 10, { allocationMethod: 'MANUAL' })],
      manualAllocations: [{ retaceoCostId: 7, allocations: [
        { retaceoDetailId: 1, amount: 8 },
        { retaceoDetailId: 2, amount: 2 },
      ] }],
    });
    expect(result.allocations.map((item) => item.allocatedCost.toString())).toEqual(['8', '2']);
  });

  it('rejects missing weight bases', () => {
    expect(() => calculateRetaceo({
      details: [detail(1, 60, 1, { weight: d(5) }), detail(2, 40)],
      costs: [cost(1, 10, { allocationMethod: 'WEIGHT' })],
    })).toThrow(RetaceoCalculationError);
  });

  it('never capitalizes import VAT', () => {
    expect(() => calculateRetaceo({
      details: [detail(1, 100)],
      costs: [cost(1, 13, { category: 'IMPORT_VAT' })],
    })).toThrow('El IVA de importación no puede incluirse');
  });
});
