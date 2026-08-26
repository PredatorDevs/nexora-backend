import { z } from 'zod';

export const productImageParams = z.object({
  productId: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive().optional(),
});

export const createProductImageBody = z.object({
  storageKey: z.string().trim().min(1).max(500),
  altText: z.string().trim().min(1).max(191).nullable().optional(),
  caption: z.string().trim().min(1).max(500).nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export const updateProductImageBody = z
  .object({
    altText: z.string().trim().min(1).max(191).nullable().optional(),
    caption: z.string().trim().min(1).max(500).nullable().optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );

export const productImageConcurrencyBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});

export const reorderProductImagesBody = z.object({
  imageIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(20)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'Image identifiers must not be repeated.',
    ),
});
