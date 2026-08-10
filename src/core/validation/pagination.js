import { z } from 'zod';
export function createListQuerySchema(sortFields, defaultSort = 'createdAt') {
  return z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
    sortBy: z.enum(sortFields).default(defaultSort),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
}
export function paginationMeta({ page, pageSize, total }) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
