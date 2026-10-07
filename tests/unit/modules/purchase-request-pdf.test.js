import { describe, expect, it } from 'vitest';
import {
  buildPurchaseRequestDocument,
  generatePurchaseRequestPdf,
} from '../../../src/modules/purchase-requests/purchase-request-pdf.js';

const request = {
  code: 'PR-000050',
  requestType: 'CONSOLIDATED',
  status: 'APPROVED',
  requestDate: new Date('2026-09-29T14:00:00.000Z'),
  requiredDate: new Date('2026-10-02T06:00:00.000Z'),
  approvedAt: new Date('2026-09-29T15:00:00.000Z'),
  justification: 'Reposición de café para atención al cliente.',
  notes: 'Entregar en recepción.',
  company: {
    legalName: 'Comercial Plásticos Moreno, S.A. de C.V.',
    commercialName: 'Comercial Plásticos Moreno',
    nit: '0614-010101-101-1',
    nrc: '123456-7',
    locale: 'es-SV',
    timezone: 'America/El_Salvador',
  },
  branch: {
    code: 'M001',
    name: 'Casa Matriz',
    addressLine: 'San Salvador',
    phone: '2222-2222',
    email: 'compras@example.com',
    country: { name: 'El Salvador' },
    department: { name: 'San Salvador' },
    municipality: null,
    district: null,
  },
  warehouse: { code: 'WH-000001', name: 'Bodega principal' },
  requestedBy: { displayName: 'María López' },
  approvedBy: { displayName: 'José Pérez' },
  sourceRequests: [{ code: 'PR-000048' }, { code: 'PR-000049' }],
  details: [
    {
      lineNumber: 1,
      quantity: '13.0000',
      description: 'Presentación grande',
      product: { internalCode: 'PRD-000001', name: 'Café molido' },
      productUnit: { name: 'Caja' },
    },
  ],
};

describe('purchase request PDF', () => {
  it('builds the printable approved request and returns a valid PDF buffer', async () => {
    const definition = buildPurchaseRequestDocument(request);
    expect(definition.info.title).toContain('PR-000050');
    expect(JSON.stringify(definition)).toContain('María López');

    const buffer = await generatePurchaseRequestPdf(request);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1_000);
  });

  it('reuses the template for a supplier-directed segment', async () => {
    const segment = {
      code: 'PR-000050-S001',
      notes: 'Confirmar disponibilidad y plazo de entrega.',
      supplier: {
        code: 'SUP-000001',
        name: 'Proveedor de prueba',
        email: 'ventas@example.com',
        phone: '2222-0000',
      },
      supplierContact: {
        fullName: 'Ana Compras',
        email: 'ana@example.com',
        phone: '7777-0000',
      },
    };

    const definition = buildPurchaseRequestDocument(request, { segment });
    const serialized = JSON.stringify(definition);
    expect(serialized).toContain('Proveedor de prueba');
    expect(serialized).toContain('PR-000050-S001');

    const buffer = await generatePurchaseRequestPdf(request, { segment });
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
