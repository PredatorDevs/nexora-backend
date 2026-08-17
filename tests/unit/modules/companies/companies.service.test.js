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
  let provisionRoles;
  let runInTransaction;
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
    provisionRoles = vi.fn();
    runInTransaction = vi.fn((operation) =>
      operation({ transaction: true }),
    );
    service = createCompaniesService({
      repository,
      entityChangeService,
      runInTransaction,
      provisionRoles,
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
    expect(provisionRoles).toHaveBeenCalledWith({ transaction: true }, 5, 9);
    expect(entityChangeService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'companies',
        entityType: 'company',
        operation: 'CREATE',
      }),
      { transaction: true },
    );
    expect(runInTransaction).toHaveBeenCalledWith(expect.any(Function), {
      maxWait: 10_000,
      timeout: 30_000,
    });
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

  it('creates a foreign company with a free-form administrative area', async () => {
    repository.findAddressContext.mockResolvedValue({
      country: { id: 2, abbreviation: 'GT' },
      district: null,
    });
    const foreignCompany = {
      ...companyData,
      countryId: 2,
      departmentId: null,
      municipalityId: null,
      districtId: null,
      foreignAdministrativeArea: 'Guatemala',
      foreignLocality: 'Ciudad de Guatemala',
    };

    await expect(service.create(foreignCompany, {})).resolves.toMatchObject({
      countryId: 2,
      foreignLocality: 'Ciudad de Guatemala',
    });
    expect(repository.create).toHaveBeenCalledWith(foreignCompany, {
      transaction: true,
    });
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
