import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createCompaniesService } from '../../../../src/modules/companies/companies.service.js';

const companyData = {
  code: 'NEXORA',
  legalName: 'Nexora, S.A. de C.V.',
  commercialName: 'Nexora',
  nit: '0614-010101-101-1',
  nrc: '123456-7',
  countryId: 1,
  departmentId: 2,
  municipalityId: 3,
  districtId: 4,
  addressLine: 'San Salvador',
  defaultCurrencyCode: 'USD',
  timezone: 'America/El_Salvador',
  locale: 'es-SV',
  economicActivities: [{ economicActivityId: 7, type: 'PRIMARY' }],
};

describe('companies service', () => {
  let repository;
  let entityChangeService;
  let service;

  beforeEach(() => {
    repository = {
      findAddressContext: vi.fn().mockResolvedValue({
        country: { id: 1, abbreviation: 'SV' },
        district: { id: 4 },
      }),
      findActiveEconomicActivities: vi.fn().mockResolvedValue([{ id: 7 }]),
      create: vi.fn().mockImplementation(async (data) => ({
        id: 5,
        status: 'ACTIVE',
        createdAt: new Date('2026-08-10T12:00:00.000Z'),
        updatedAt: new Date('2026-08-10T12:00:00.000Z'),
        ...data,
        economicActivities: data.economicActivities.map((activity) => ({
          type: activity.type,
          economicActivity: {
            id: activity.economicActivityId,
            code: '62010',
            name: 'Programming',
          },
        })),
      })),
    };
    entityChangeService = { record: vi.fn() };
    service = createCompaniesService({
      repository,
      entityChangeService,
      runInTransaction: (operation) => operation({ transaction: true }),
    });
  });

  it('creates a company and its activities in one transaction', async () => {
    const created = await service.create(companyData, {
      actorUserId: 9,
      requestId: 'request-1',
    });

    expect(created.id).toBe(5);
    expect(repository.create).toHaveBeenCalledWith(companyData, {
      transaction: true,
    });
    expect(entityChangeService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'companies',
        entityType: 'company',
        operation: 'CREATE',
      }),
      { transaction: true },
    );
  });

  it('rejects a broken territorial hierarchy', async () => {
    repository.findAddressContext.mockResolvedValue({
      country: { id: 1, abbreviation: 'SV' },
      district: null,
    });

    await expect(
      service.create(companyData, {
        actorUserId: 9,
        requestId: 'request-2',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rejects inactive or unknown economic activities', async () => {
    repository.findActiveEconomicActivities.mockResolvedValue([]);

    await expect(
      service.create(companyData, {
        actorUserId: 9,
        requestId: 'request-3',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { invalidEconomicActivityIds: [7] },
    });
  });
});
