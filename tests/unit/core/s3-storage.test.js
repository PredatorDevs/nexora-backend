import { describe, expect, it, vi } from 'vitest';
import { createFileStorage } from '../../../src/core/storage/s3-storage.js';

const settings = {
  driver: 's3',
  region: 'us-east-2',
  bucket: 'nexora-assets',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
  sessionToken: null,
  publicBaseUrl: null,
  uploadExpiresInSeconds: 300,
  readExpiresInSeconds: 900,
  maxImageSizeBytes: 5_000_000,
};

describe('S3 file storage', () => {
  it('prepares a tenant-scoped image upload with enforced conditions', async () => {
    const createPost = vi
      .fn()
      .mockResolvedValue({
        url: 'https://upload.example',
        fields: { policy: 'signed' },
      });
    const storage = createFileStorage(settings, {
      client: {},
      createPost,
      uuid: () => 'fixed-id',
      clock: () => 0,
    });
    const result = await storage.prepareImageUpload({
      companyId: 7,
      purpose: 'PRODUCT_IMAGE',
      contentType: 'image/webp',
      sizeBytes: 1000,
    });
    expect(result).toMatchObject({
      method: 'POST',
      storageKey: 'companies/7/products/fixed-id.webp',
      expiresAt: '1970-01-01T00:05:00.000Z',
    });
    expect(createPost).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        Bucket: 'nexora-assets',
        Key: 'companies/7/products/fixed-id.webp',
        Conditions: expect.arrayContaining([
          ['content-length-range', 1, 5_000_000],
        ]),
      }),
    );
  });

  it('rejects unsupported or oversized images', async () => {
    const storage = createFileStorage(settings, { client: {} });
    await expect(
      storage.prepareImageUpload({
        companyId: 1,
        purpose: 'PRODUCT_IMAGE',
        contentType: 'image/svg+xml',
        sizeBytes: 10,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      storage.prepareImageUpload({
        companyId: 1,
        purpose: 'PRODUCT_IMAGE',
        contentType: 'image/png',
        sizeBytes: 6_000_000,
      }),
    ).rejects.toMatchObject({ statusCode: 413 });
  });

  it('never signs a key owned by another company', async () => {
    const storage = createFileStorage(settings, {
      client: {},
      signUrl: vi.fn(),
    });
    await expect(
      storage.createReadUrl({
        companyId: 8,
        storageKey: 'companies/7/products/file.webp',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('fails explicitly when storage is disabled', async () => {
    const storage = createFileStorage({ driver: 'disabled' });
    await expect(() => storage.prepareImageUpload()).toThrow(
      expect.objectContaining({ statusCode: 503 }),
    );
  });
});
