import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSuppliersService } from '../../../../src/modules/suppliers/suppliers.service.js';

const supplierData = {
  name: 'Proveedor Uno', nit: null, nrc: null, countryId: 1,
  departmentId: 2, municipalityId: 3, districtId: 4,
  foreignAdministrativeArea: null, foreignLocality: null,
  addressLine: 'Centro', phone: null, email: null, website: null,
};
describe('suppliers service', () => {
  let repository;
  let service;
  let changes;
  beforeEach(() => {
    repository = {
      findAddressContext: vi.fn().mockResolvedValue({
        company: { id: 7, status: 'ACTIVE' },
        country: { id: 1, abbreviation: 'SV' },
        district: { id: 4 },
      }),
      createSupplier: vi.fn().mockResolvedValue({
        id: 9, companyId: 7, code: 'SUP-000001', isActive: true,
        createdAt: new Date(), updatedAt: new Date(), ...supplierData,
      }),
      findSupplier: vi.fn().mockResolvedValue({
        id: 9, companyId: 7, isActive: true,
      }),
      findPrimaryContact: vi.fn().mockResolvedValue(null),
      createContact: vi.fn().mockResolvedValue({
        id: 12, companyId: 7, supplierId: 9, fullName: 'Ana Pérez',
        isPrimary: true, isActive: true, validFrom: new Date(), validUntil: null,
        createdAt: new Date(), updatedAt: new Date(),
      }),
    };
    changes = { record: vi.fn() };
    service = createSuppliersService({
      repository,
      entityChangeService: changes,
      runInTransaction: (operation) => operation({ tx: true }),
      generateCode: vi.fn().mockResolvedValue('SUP-000001'),
    });
  });

  it('creates a tenant-scoped supplier with an automatic code', async () => {
    await expect(service.create(7, supplierData, { actorUserId: 1 })).resolves.toMatchObject({
      code: 'SUP-000001',
    });
    expect(repository.createSupplier).toHaveBeenCalledWith(
      7,
      { ...supplierData, code: 'SUP-000001' },
      { tx: true },
    );
    expect(changes.record).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'supplier', companyId: 7, operation: 'CREATE' }),
      { tx: true },
    );
  });

  it('rejects an invalid Salvadoran hierarchy', async () => {
    repository.findAddressContext.mockResolvedValue({
      company: { id: 7, status: 'ACTIVE' },
      country: { id: 1, abbreviation: 'SV' },
      district: null,
    });
    await expect(service.create(7, supplierData, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(repository.createSupplier).not.toHaveBeenCalled();
  });

  it('creates a primary contact without overwriting previous identities', async () => {
    await expect(
      service.createContact(
        7,
        9,
        { fullName: 'Ana Pérez', isPrimary: true },
        { actorUserId: 1 },
      ),
    ).resolves.toMatchObject({ id: 12, isPrimary: true });
    expect(repository.findPrimaryContact).toHaveBeenCalledWith(7, 9, {
      tx: true,
    });
    expect(repository.createContact).toHaveBeenCalledWith(
      7,
      9,
      { fullName: 'Ana Pérez', isPrimary: true },
      { tx: true },
    );
  });
});
