import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const status = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
const nullableString = (maximum) =>
  z.string().trim().min(1).max(maximum).nullable().optional();
const fields = {
  name: z.string().trim().min(1).max(191),
  isHeadquarters: z.boolean().default(false),
  countryId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  municipalityId: z.number().int().positive(),
  districtId: z.number().int().positive(),
  addressLine: z.string().trim().min(1).max(500),
  phone: nullableString(30),
  email: z.string().trim().toLowerCase().email().max(191).nullable().optional(),
};
export const branchIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const branchesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'name',
  'status',
]).extend({
  status: status.optional(),
  isHeadquarters: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export const createBranchBody = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9_-]*$/)
    .max(50),
  ...fields,
});
export const updateBranchBody = z
  .object({
    ...Object.fromEntries(
      Object.entries(fields).map(([key, schema]) => [key, schema.optional()]),
    ),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateBranchStatusBody = z.object({
  status,
  expectedUpdatedAt: z.string().datetime(),
});
