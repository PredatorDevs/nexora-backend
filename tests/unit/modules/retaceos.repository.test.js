import { describe, expect, it, vi } from 'vitest';
import { createRetaceosRepository } from '../../../src/modules/retaceos/retaceos.repository.js';

describe('retaceos repository', () => {
  it('selects valid country fields when returning a retaceo', async () => {
    const client = {
      retaceo: {
        findFirst: vi.fn().mockResolvedValue({ id: 10 }),
      },
    };
    const repository = createRetaceosRepository(client);

    await repository.find(6, 10);

    const query = client.retaceo.findFirst.mock.calls[0][0];
    expect(query.where).toEqual({ id: 10, companyId: 6 });
    expect(query.select.originCountry).toEqual({
      select: { id: true, abbreviation: true, name: true },
    });
    expect(query.select.originCountry.select).not.toHaveProperty('iso2');
  });

  it('lists purchases without a non-cancelled retaceo as eligible', async () => {
    const client = {
      purchase: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const repository = createRetaceosRepository(client);

    await repository.eligiblePurchases(6, {
      page: 1,
      pageSize: 20,
      sortBy: 'purchaseDate',
      sortOrder: 'desc',
    });

    expect(client.purchase.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        companyId: 6,
        retaceos: { none: { status: { not: 'CANCELLED' } } },
      }),
    }));
  });
});
