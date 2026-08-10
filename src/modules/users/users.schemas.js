import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';
export const userIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const usersListQuery = createListQuerySchema([
  'createdAt',
  'email',
  'displayName',
  'status',
]);
export const createUserBody = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
  password: z.string().min(12).max(1024),
  displayName: z.string().trim().min(1).max(120),
  mustChangePassword: z.boolean().optional().default(true),
});
export const updateUserBody = z
  .object({
    email: z.string().trim().toLowerCase().email().max(191).optional(),
    displayName: z.string().trim().min(1).max(120).optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateUserStatusBody = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
  expectedUpdatedAt: z.string().datetime(),
});
export const replaceUserRolesBody = z.object({
  roleIds: z.array(z.number().int().positive()).max(100),
  expectedUpdatedAt: z.string().datetime(),
});
export const resetUserPasswordBody = z.object({
  password: z.string().min(12).max(1024),
  mustChangePassword: z.boolean().optional().default(true),
  expectedUpdatedAt: z.string().datetime(),
});
