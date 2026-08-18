import { describe, expect, it, vi } from 'vitest';
import {
  businessCodeEntities,
  generateBusinessCode,
} from '../../../src/core/code-generation/business-code.js';

describe('business code generator', () => {
  it('generates a platform-scoped company code', async () => {
    const upsert = vi.fn().mockResolvedValue({ nextValue: 2n });
    await expect(
      generateBusinessCode(
        { codeSequence: { upsert } },
        businessCodeEntities.company,
      ),
    ).resolves.toBe('COM-000001');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { namespace: 'company' } }),
    );
  });

  it('isolates branch sequences by company', async () => {
    const upsert = vi.fn().mockResolvedValue({ nextValue: 43n });
    await expect(
      generateBusinessCode(
        { codeSequence: { upsert } },
        businessCodeEntities.branch,
        { companyId: 7 },
      ),
    ).resolves.toBe('BR-000042');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { namespace: 'branch:7' } }),
    );
  });

  it('isolates location sequences by warehouse', async () => {
    const upsert = vi.fn().mockResolvedValue({ nextValue: 8n });
    await expect(
      generateBusinessCode(
        { codeSequence: { upsert } },
        businessCodeEntities.location,
        { warehouseId: 15 },
      ),
    ).resolves.toBe('LOC-000007');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { namespace: 'location:15' } }),
    );
  });

  it('generates supplier codes per company', async () => {
    const upsert = vi.fn().mockResolvedValue({ nextValue: 4n });
    await expect(
      generateBusinessCode(
        { codeSequence: { upsert } },
        businessCodeEntities.supplier,
        { companyId: 12 },
      ),
    ).resolves.toBe('SUP-000003');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { namespace: 'supplier:12' } }),
    );
  });
  it.each([
    [businessCodeEntities.brand, 'MAR-000003', 'brand:12'],
    [businessCodeEntities.productCategory, 'CAT-000003', 'product_category:12'],
  ])(
    'generates product dictionary codes per company',
    async (entity, expected, namespace) => {
      const upsert = vi.fn().mockResolvedValue({ nextValue: 4n });
      await expect(
        generateBusinessCode({ codeSequence: { upsert } }, entity, {
          companyId: 12,
        }),
      ).resolves.toBe(expected);
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { namespace } }),
      );
    },
  );
});
