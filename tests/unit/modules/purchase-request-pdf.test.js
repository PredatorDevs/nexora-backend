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
});
