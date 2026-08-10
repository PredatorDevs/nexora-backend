import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

export const economicActivitiesListQuery = createListQuerySchema(
  ['code', 'name', 'createdAt'],
  'code',
).extend({
  activeOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('true'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
