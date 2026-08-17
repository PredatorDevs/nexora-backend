import { z } from 'zod';

import { createListQuerySchema } from '../../core/validation/pagination.js';

export const companyAccessParams = z.object({
  companyId: z.coerce.number().int().positive(),
});

export const membershipParams = companyAccessParams.extend({
  membershipId: z.coerce.number().int().positive(),
});

export const companyRoleParams = companyAccessParams.extend({
  roleId: z.coerce.number().int().positive(),
});

export const membershipsListQuery = createListQuerySchema([
  'createdAt',
  'joinedAt',
  'status',
]).extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const addMembershipBody = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
  roleIds: z.array(z.number().int().positive()).min(1).max(100),
});

export const changeMembershipStatusBody = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  expectedUpdatedAt: z.string().datetime(),
});

export const replaceMembershipRolesBody = z.object({
  roleIds: z.array(z.number().int().positive()).min(1).max(100),
  expectedUpdatedAt: z.string().datetime(),
});

export const companyRolesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'isSystem',
]);

export const createCompanyRoleBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
});

export const updateCompanyRoleBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );

export const replaceCompanyRolePermissionsBody = z.object({
  permissionCodes: z.array(z.string()).max(200),
  expectedUpdatedAt: z.string().datetime(),
});

export const deleteCompanyRoleQuery = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
