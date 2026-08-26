import { z } from 'zod';
export const prepareImageUploadBody = z.object({
  purpose: z.enum(['PRODUCT_IMAGE', 'COMPANY_LOGO', 'BRAND_LOGO']),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive(),
});
export const createFileReadUrlBody = z.object({
  storageKey: z.string().trim().min(1).max(1024),
});
