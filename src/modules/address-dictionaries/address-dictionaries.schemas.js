import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const activeOnly = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .default('true');

const baseDictionaryQuery = createListQuerySchema(
  ['name', 'mhCode', 'createdAt'],
  'name',
).extend({
  activeOnly,
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const countriesListQuery = baseDictionaryQuery.extend({
  sortBy: z
    .enum(['name', 'abbreviation', 'mhCode', 'createdAt'])
    .default('name'),
});

export const departmentsListQuery = baseDictionaryQuery.extend({
  sortBy: z.enum(['name', 'abbreviation', 'mhCode', 'zone']).default('name'),
  zone: z.coerce.number().int().min(1).max(4).optional(),
});

export const municipalitiesListQuery = baseDictionaryQuery.extend({
  departmentId: z.coerce.number().int().positive().optional(),
});

export const districtsListQuery = baseDictionaryQuery.extend({
  municipalityId: z.coerce.number().int().positive().optional(),
});
