import { describe, expect, it } from 'vitest';
import {
  createRetaceoBody,
  createRetaceoCostBody,
  retaceosListQuery,
} from '../../../src/modules/retaceos/retaceos.schemas.js';

describe('retaceos schemas', () => {
  it('normalizes list defaults and creation options', () => {
    expect(retaceosListQuery.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(createRetaceoBody.parse({
      purchaseId: 1,
      originCountryId: 2,
      retaceoDate: '2026-09-30T12:00:00.000Z',
    }).includeOrderExpenses).toBe(true);
  });

  it('rejects a recoverable tax marked as capitalizable', () => {
    const result = createRetaceoCostBody.safeParse({
      expectedRetaceoUpdatedAt: '2026-09-30T12:00:00.000Z',
      expenseTypeId: 1,
      currencyCode: 'usd',
      originalAmount: 100,
      isRecoverableTax: true,
      isCapitalizable: true,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['isCapitalizable']);
  });
});
