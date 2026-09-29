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
});
