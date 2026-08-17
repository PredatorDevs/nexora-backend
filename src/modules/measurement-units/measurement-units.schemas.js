import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

export const measurementUnitsListQuery = createListQuerySchema(
  ['name', 'pluralName', 'symbol', 'mhCode', 'createdAt'],
  'name',
).extend({
  activeOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('true'),
  fiscalOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('false'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
