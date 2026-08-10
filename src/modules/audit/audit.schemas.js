import { z } from 'zod';

export const auditListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().min(1).max(150).optional(),
  actorUserId: z.coerce.number().int().positive().optional(),
  resourceType: z.string().trim().min(1).max(100).optional(),
  result: z.enum(['SUCCESS', 'FAILURE']).optional(),
});
