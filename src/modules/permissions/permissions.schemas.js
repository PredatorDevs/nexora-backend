import { createListQuerySchema } from '../../core/validation/pagination.js';
export const permissionsListQuery = createListQuerySchema(
  ['code', 'resource', 'action', 'createdAt'],
  'code',
);
