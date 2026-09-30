import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  RetaceoValidationError,
  validateCalculatedRetaceo,
} from '../../../src/modules/retaceos/retaceo-validator.js';

const d = (value) => new Prisma.Decimal(value);
const validRetaceo = (overrides = {}) => ({
  calculationVersion: 1,
  calculatedAt: new Date(),
  calculatedBy: { id: 2 },
  importInvoiceNumber: null,
  importInvoiceDate: null,
  importPolicyNumber: null,
  importPolicyDate: null,
  totalFob: d(100),
  totalCif: d(110),
  totalCapitalizableCosts: d(10),
  totalRecoverableTaxes: d(13),
  totalLandedCost: d(110),
  details: [{
    id: 1, quantity: d(2), fobTotal: d(100),
    allocatedCapitalizableCost: d(10), totalCost: d(110), unitCost: d(55),
  }],
  costs: [
    {
      id: 7, category: 'FREIGHT', baseAmount: d(10), isCapitalizable: true,
      isRecoverableTax: false, isCifComponent: true,
      allocations: [{ retaceoDetailId: 1, allocatedCost: d(10) }],
    },
    {
      id: 8, category: 'IMPORT_VAT', baseAmount: d(13), isCapitalizable: false,
      isRecoverableTax: true, isCifComponent: false, allocations: [],
    },
  ],
  ...overrides,
});

describe('retaceo closing validation', () => {
  it('accepts a fully balanced calculation', () => {
    expect(validateCalculatedRetaceo(validRetaceo())).toBe(true);
  });

  it('rejects a landed cost that does not match its product details', () => {
    expect(() => validateCalculatedRetaceo(validRetaceo({ totalLandedCost: d(111) })))
      .toThrow(RetaceoValidationError);
  });

  it('requires import document number and date as a pair', () => {
    expect(() => validateCalculatedRetaceo(validRetaceo({ importPolicyNumber: 'POL-1' })))
      .toThrow('deben registrarse juntos');
  });
});
