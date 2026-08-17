import { describe, expect, it } from 'vitest';

import {
  createCompanyBody,
  updateCompanyBody,
} from '../../../../src/modules/companies/companies.schemas.js';

const validCompany = {
  legalName: 'Nexora Sociedad Anónima de Capital Variable',
  commercialName: 'Nexora',
  nit: '0614-010101-101-1',
  nrc: '123456-7',
  countryId: 1,
  departmentId: 1,
  municipalityId: 1,
  districtId: 1,
  addressLine: 'San Salvador, El Salvador',
  economicActivities: [{ economicActivityId: 10, type: 'PRIMARY' }],
};

describe('company schemas', () => {
  it('normalizes a valid company and applies regional defaults', () => {
    const result = createCompanyBody.parse({
      ...validCompany,
      code: 'CLIENT_VALUE_MUST_BE_IGNORED',
      email: ' INFO@NEXORA.COM ',
    });

    expect(result).toMatchObject({
      email: 'info@nexora.com',
      defaultCurrencyCode: 'USD',
      timezone: 'America/El_Salvador',
      locale: 'es-SV',
    });
    expect(result).not.toHaveProperty('code');
  });

  it('requires exactly one primary type and unique activities', () => {
    const withoutPrimary = createCompanyBody.safeParse({
      ...validCompany,
      economicActivities: [{ economicActivityId: 10, type: 'SECONDARY' }],
    });
    const repeated = createCompanyBody.safeParse({
      ...validCompany,
      economicActivities: [
        { economicActivityId: 10, type: 'PRIMARY' },
        { economicActivityId: 10, type: 'SECONDARY' },
      ],
    });

    expect(withoutPrimary.success).toBe(false);
    expect(repeated.success).toBe(false);
  });

  it('requires a business change on update', () => {
    expect(
      updateCompanyBody.safeParse({
        expectedUpdatedAt: '2026-08-10T12:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});
