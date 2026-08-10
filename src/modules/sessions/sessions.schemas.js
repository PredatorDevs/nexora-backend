import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const sessionIdParams = z.object({ id: z.string().uuid() });
export const sessionsListQuery = createListQuerySchema(
  ['createdAt', 'expiresAt', 'lastUsedAt'],
  'createdAt',
).extend({
  userId: z.coerce.number().int().positive().optional(),
  activeOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
});
