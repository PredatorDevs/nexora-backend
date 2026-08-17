import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const nullableString = (maximum) => z.string().trim().min(1).max(maximum).nullable().optional();
const supplierFields = {
  name: z.string().trim().min(1).max(191),
  nit: nullableString(25),
  nrc: nullableString(25),
  countryId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  municipalityId: z.number().int().positive().nullable().optional(),
  districtId: z.number().int().positive().nullable().optional(),
  foreignAdministrativeArea: nullableString(191),
  foreignLocality: nullableString(191),
  addressLine: z.string().trim().min(1).max(500),
  phone: nullableString(30),
  email: z.string().trim().toLowerCase().email().max(191).nullable().optional(),
  website: z.string().trim().url().max(500).nullable().optional(),
};
const contactFields = {
  fullName: z.string().trim().min(1).max(191),
  jobTitle: nullableString(120),
  department: nullableString(120),
  phone: nullableString(30),
  email: z.string().trim().toLowerCase().email().max(191).nullable().optional(),
  notes: nullableString(5000),
};

export const supplierIdParams = z.object({ supplierId: z.coerce.number().int().positive() });
export const supplierContactParams = supplierIdParams.extend({
  contactId: z.coerce.number().int().positive(),
});
export const suppliersListQuery = createListQuerySchema([
  'createdAt', 'code', 'name', 'isActive',
]).extend({
  countryId: z.coerce.number().int().positive().optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const supplierContactsListQuery = createListQuerySchema([
  'createdAt', 'fullName', 'isPrimary', 'isActive',
]).extend({
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
export const createSupplierBody = z.object(supplierFields);
export const updateSupplierBody = z.object({
  ...Object.fromEntries(Object.entries(supplierFields).map(([key, schema]) => [key, schema.optional()])),
  expectedUpdatedAt: z.string().datetime(),
}).refine(
  (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
  'At least one field is required.',
);
export const updateSupplierStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
export const createSupplierContactBody = z.object({
  ...contactFields,
  isPrimary: z.boolean().default(false),
  validFrom: z.string().datetime().optional(),
});
export const updateSupplierContactBody = z.object({
  ...Object.fromEntries(Object.entries(contactFields).map(([key, schema]) => [key, schema.optional()])),
  expectedUpdatedAt: z.string().datetime(),
}).refine(
  (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
  'At least one field is required.',
);
export const updateSupplierContactStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
export const setPrimarySupplierContactBody = z.object({
  expectedUpdatedAt: z.string().datetime(),
});
