import { z } from 'zod';

import { createListQuerySchema } from '../../core/validation/pagination.js';

const activityType = z.enum(['PRIMARY', 'SECONDARY', 'TERTIARY']);
const companyStatus = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);
const nullableString = (maximum) =>
  z.string().trim().min(1).max(maximum).nullable().optional();

const economicActivities = z
  .array(
    z.object({
      economicActivityId: z.number().int().positive(),
      type: activityType,
    }),
  )
  .min(1)
  .max(3)
  .superRefine((activities, context) => {
    const types = new Set(activities.map(({ type }) => type));
    const ids = new Set(
      activities.map(({ economicActivityId }) => economicActivityId),
    );
    if (!types.has('PRIMARY')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A primary economic activity is required.',
      });
    }
    if (types.size !== activities.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Economic activity types cannot be repeated.',
      });
    }
    if (ids.size !== activities.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Economic activities cannot be repeated.',
      });
    }
  });

const companyFields = {
  legalName: z.string().trim().min(1).max(191),
  commercialName: z.string().trim().min(1).max(191),
  nit: z.string().trim().min(1).max(25),
  nrc: z.string().trim().min(1).max(25),
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
  logoStorageKey: nullableString(500),
  defaultCurrencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default('USD'),
  timezone: z.string().trim().min(1).max(100).default('America/El_Salvador'),
  locale: z.string().trim().min(2).max(20).default('es-SV'),
  economicActivities,
};

export const companyIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const companiesListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'legalName',
  'commercialName',
  'status',
]).extend({
  status: companyStatus.optional(),
});

export const createCompanyBody = z.object({
  ...companyFields,
});

export const updateCompanyBody = z
  .object({
    ...Object.fromEntries(
      Object.entries(companyFields).map(([key, schema]) => [
        key,
        schema.optional(),
      ]),
    ),
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );

export const updateCompanyStatusBody = z.object({
  status: companyStatus,
  expectedUpdatedAt: z.string().datetime(),
});
