import { z } from 'zod';
import { createListQuerySchema } from '../../core/validation/pagination.js';

const coordinate = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .transform((value) => value.toUpperCase());
const capacity = z.coerce
  .number()
  .positive()
  .max(99999999999999)
  .nullable()
  .optional();
const capacityUnit = z
  .enum(['UNITS', 'KG', 'M3', 'PALLETS'])
  .nullable()
  .optional();
const notes = z.string().trim().min(1).max(5000).nullable().optional();
const capacityPair = (value, context) => {
  const hasCapacity = value.capacity != null;
  const hasUnit = value.capacityUnit != null;
  if (hasCapacity !== hasUnit) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Capacity and capacity unit must be provided together.',
      path: hasCapacity ? ['capacityUnit'] : ['capacity'],
    });
  }
};

export const locationIdParams = z.object({
  id: z.coerce.number().int().positive(),
});
export const locationsListQuery = createListQuerySchema([
  'createdAt',
  'code',
  'aisle',
  'rack',
  'level',
  'position',
  'isActive',
]).extend({
  branchId: z.coerce.number().int().positive().optional(),
  warehouseId: z.coerce.number().int().positive().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
export const createLocationBody = z
  .object({
    warehouseId: z.number().int().positive(),
    aisle: coordinate,
    rack: coordinate,
    level: coordinate,
    position: coordinate,
    capacity,
    capacityUnit,
    notes,
  })
  .superRefine(capacityPair);
export const createLocationsBulkBody = z
  .object({
    warehouseId: z.number().int().positive(),
    aisle: coordinate,
    rack: coordinate,
    levelCount: z.number().int().min(1).max(50),
    positionsPerLevel: z.number().int().min(1).max(100),
    capacity,
    capacityUnit,
    notes,
  })
  .superRefine((value, context) => {
    capacityPair(value, context);
    if (value.levelCount * value.positionsPerLevel > 200) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A bulk operation can create at most 200 locations.',
        path: ['positionsPerLevel'],
      });
    }
  });
export const updateLocationBody = z
  .object({
    aisle: coordinate.optional(),
    rack: coordinate.optional(),
    level: coordinate.optional(),
    position: coordinate.optional(),
    capacity,
    capacityUnit,
    notes,
    expectedUpdatedAt: z.string().datetime(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt'),
    'At least one field is required.',
  );
export const updateLocationStatusBody = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime(),
});
