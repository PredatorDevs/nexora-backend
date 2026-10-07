import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { createPurchaseRequestsService } from '../../../src/modules/purchase-requests/purchase-requests.service.js';

const context = { actorUserId: 9 };
const source = (id, detailId, quantity) => ({
  id,
  details: [
    {
      id: detailId,
      productId: 10,
      productUnitId: 20,
      quantity: new Prisma.Decimal(quantity),
    },
  ],
});

function setup(sources) {
  const created = {
    id: 50,
    code: 'PR-000050',
    requestType: 'CONSOLIDATED',
    details: [],
  };
  const repository = {
    find: vi.fn(),
    findConsolidationSources: vi.fn().mockResolvedValue(sources),
    findReferences: vi.fn().mockResolvedValue({
      company: { status: 'ACTIVE' },
      branch: { status: 'ACTIVE' },
      warehouse: { isActive: true, branchId: 3 },
      products: [
        {
          id: 10,
          isActive: true,
          purchaseUnitId: 20,
          purchaseUnit: { isActive: true, type: 'PURCHASE' },
        },
      ],
    }),
    createConsolidation: vi.fn().mockResolvedValue(created),
    lockForSegment: vi.fn(),
    findSegmentReferences: vi.fn().mockResolvedValue({
      supplier: { id: 30, isActive: true },
      contact: { id: 31, supplierId: 30, isActive: true },
      details: [{ id: 101, quantity: new Prisma.Decimal(10) }],
    }),
    nextSegmentNumber: vi.fn().mockResolvedValue({ _max: { segmentNumber: 1 } }),
    createSegment: vi.fn().mockResolvedValue({ id: 70, code: 'PR-000050-S002' }),
    findSegment: vi.fn(),
  };
  const entityChangeService = { record: vi.fn() };
  const generatePdf = vi.fn().mockResolvedValue(Buffer.from('%PDF-test'));
  const service = createPurchaseRequestsService({
    repository,
    entityChangeService,
    runInTransaction: (callback) => callback({ transaction: true }),
    generateCode: vi.fn().mockResolvedValue('PR-000050'),
    generatePdf,
  });
  return { service, repository, entityChangeService, generatePdf, created };
}

const body = {
  sourceRequestIds: [1, 2],
  branchId: 3,
  warehouseId: 4,
  requiredDate: '2099-10-10T00:00:00.000Z',
  justification: 'Reposición consolidada',
  notes: '',
};

describe('purchase requests service consolidation', () => {
  it('groups equal product and unit lines and creates a consolidated draft', async () => {
    const { service, repository, entityChangeService, created } = setup([
      source(1, 11, '2.5000'),
      source(2, 12, '3.2500'),
    ]);

    await expect(service.consolidate(6, body, context)).resolves.toBe(created);

    const consolidation = repository.createConsolidation.mock.calls[0][1];
    expect(consolidation).toMatchObject({
      requestType: 'CONSOLIDATED',
      branchId: 3,
      warehouseId: 4,
      code: 'PR-000050',
      requestedByUserId: 9,
    });
    expect(consolidation.details).toHaveLength(1);
    expect(consolidation.details[0].quantity.toString()).toBe('5.75');
    expect(entityChangeService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          reason: 'CONSOLIDATED',
          sourceRequestIds: [1, 2],
        },
      }),
      expect.anything(),
    );
  });

  it('rejects when an origin request is no longer eligible', async () => {
    const { service, repository } = setup([source(1, 11, '2')]);

    await expect(service.consolidate(6, body, context)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(repository.createConsolidation).not.toHaveBeenCalled();
  });

  it('generates the PDF only for an approved consolidated request', async () => {
    const { service, repository, generatePdf } = setup([]);
    const printable = {
      id: 50,
      code: 'PR-000050',
      requestType: 'CONSOLIDATED',
      status: 'APPROVED',
    };
    repository.find.mockResolvedValue(printable);

    await expect(service.pdf(6, 50)).resolves.toEqual({
      buffer: Buffer.from('%PDF-test'),
      filename: 'solicitud-PR-000050.pdf',
    });
    expect(generatePdf).toHaveBeenCalledWith(printable);
  });

  it('rejects the PDF for an individual request', async () => {
    const { service, repository, generatePdf } = setup([]);
    repository.find.mockResolvedValue({
      id: 1,
      code: 'PR-000001',
      requestType: 'STANDARD',
      status: 'APPROVED',
    });

    await expect(service.pdf(6, 1)).rejects.toMatchObject({ statusCode: 409 });
    expect(generatePdf).not.toHaveBeenCalled();
  });

  it('creates a supplier segment with selected request lines', async () => {
    const { service, repository } = setup([]);
    repository.find.mockResolvedValue({
      id: 50,
      code: 'PR-000050',
      requestType: 'CONSOLIDATED',
      status: 'APPROVED',
    });

    await service.createSegment(6, 50, {
      supplierId: 30,
      supplierContactId: 31,
      notes: 'Cotizar antes del viernes',
      details: [{ purchaseRequestDetailId: 101, quantity: 8 }],
    }, context);

    expect(repository.createSegment).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 6,
        purchaseRequestId: 50,
        segmentNumber: 2,
        code: 'PR-000050-S002',
        createdByUserId: 9,
      }),
      [expect.objectContaining({
        purchaseRequestDetailId: 101,
        quantity: new Prisma.Decimal(8),
      })],
      expect.anything(),
    );
  });

  it('generates an issued segment PDF using only its selected lines', async () => {
    const { service, repository, generatePdf } = setup([]);
    const detail = {
      id: 101,
      lineNumber: 1,
      quantity: new Prisma.Decimal(10),
      notes: null,
    };
    const request = {
      id: 50,
      code: 'PR-000050',
      requestType: 'CONSOLIDATED',
      status: 'APPROVED',
      details: [detail],
    };
    const segment = {
      id: 70,
      code: 'PR-000050-S001',
      status: 'ISSUED',
      supplier: { code: 'SUP-000001' },
      details: [{
        quantity: new Prisma.Decimal(4),
        notes: 'Empaque sellado',
        purchaseRequestDetail: detail,
      }],
    };
    repository.find.mockResolvedValue(request);
    repository.findSegment.mockResolvedValue(segment);

    await service.segmentPdf(6, 50, 70);

    expect(generatePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        details: [expect.objectContaining({
          id: 101,
          quantity: new Prisma.Decimal(4),
          notes: 'Empaque sellado',
        })],
      }),
      { segment },
    );
  });
});
