import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const roleIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const rolesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'isSystem',
]);
export const createRoleBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
});
export const updateRoleBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const replaceRolePermissionsBody = z.object({
  permissionCodes: z.array(z.string()).max(200),
  expectedUpdatedAt: z.string().datetime(),
});
export const deleteRoleQuery = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
