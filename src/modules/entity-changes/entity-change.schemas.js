import { z } from 'zod';

const dateTime = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

export const entityChangeListQuery = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    schemaName: z.string().trim().min(1).max(100).default('administration'),
    entityType: z.string().trim().min(1).max(100).optional(),
    entityId: z.string().trim().min(1).max(191).optional(),
    operation: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
    actorUserId: z.coerce.number().int().positive().optional(),
    from: dateTime.optional(),
    to: dateTime.optional(),
  })
  .superRefine((query, context) => {
    if (query.entityId && !query.entityType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Requires entityType',
        path: ['entityId'],
      });
    }
    if (query.from && query.to && query.from > query.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must not be after to',
        path: ['from'],
      });
    }
    if (
      query.from &&
      query.to &&
      query.to.getTime() - query.from.getTime() > 90 * 24 * 60 * 60 * 1000
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date range must not exceed 90 days',
        path: ['to'],
      });
    }
  });

export const entityChangeIdParams = z.object({
  id: z.coerce.bigint().positive(),
});
