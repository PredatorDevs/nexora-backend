import { describe, expect, it } from 'vitest';
import { createSupplierBody, createSupplierContactBody } from '../../../../src/modules/suppliers/suppliers.schemas.js';

describe('supplier schemas', () => {
  it('ignores manual supplier codes and normalizes email', () => {
    const value = createSupplierBody.parse({
      code: 'MANUAL', name: 'Proveedor', countryId: 1,
      departmentId: 2, municipalityId: 3, districtId: 4,
      addressLine: 'Centro', email: ' SALES@EXAMPLE.COM ',
    });
    expect(value).not.toHaveProperty('code');
    expect(value.email).toBe('sales@example.com');
  });

  it('validates and normalizes a contact', () => {
    expect(createSupplierContactBody.parse({
      fullName: 'Ana Pérez', email: ' ANA@EXAMPLE.COM ', isPrimary: true,
    })).toMatchObject({ fullName: 'Ana Pérez', email: 'ana@example.com', isPrimary: true });
  });
});
