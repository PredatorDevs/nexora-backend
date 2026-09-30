import { describe, expect, it } from 'vitest';
import {
  createExpenseTypeBody,
  updateExpenseTypeBody,
} from '../../../src/modules/expense-types/expense-types.schemas.js';

describe('expense type landed-cost configuration', () => {
  it('adds safe defaults without changing existing create payloads', () => {
    expect(createExpenseTypeBody.parse({ name: 'Honorarios' })).toMatchObject({
      landedCostCategory: 'OTHER',
      defaultAllocationMethod: 'FOB_VALUE',
      isCapitalizable: false,
      isRecoverableTax: false,
      isCifComponent: false,
    });
  });

  it('accepts an import VAT configuration that is not capitalizable', () => {
    expect(
      updateExpenseTypeBody.parse({
        landedCostCategory: 'IMPORT_VAT',
        defaultAllocationMethod: 'FOB_VALUE',
        isCapitalizable: false,
        isRecoverableTax: true,
        isCifComponent: false,
        expectedUpdatedAt: '2026-09-30T12:00:00.000Z',
      }),
    ).toMatchObject({
      landedCostCategory: 'IMPORT_VAT',
      isRecoverableTax: true,
    });
  });
});
