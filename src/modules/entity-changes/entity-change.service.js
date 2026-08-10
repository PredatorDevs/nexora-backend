import {
  entityChangeOperations,
  entityChangeSources,
} from './entity-change.constants.js';
import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 7;
const MAX_RANGE_DAYS = 90;
const technicalFields = new Set(['id', 'createdAt', 'updatedAt']);

function changedFields(oldValues, newValues) {
  const keys = new Set([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);
  return [...keys].filter(
    (key) =>
      !technicalFields.has(key) &&
      JSON.stringify(oldValues?.[key] ?? null) !==
        JSON.stringify(newValues?.[key] ?? null),
  );
}

function pickFields(values, fields) {
  if (values == null) return null;
  return Object.fromEntries(
    fields
      .filter((field) => Object.hasOwn(values, field))
      .map((field) => [field, values[field]]),
  );
}

function compactSnapshots(operation, oldValues, newValues) {
  const fields = changedFields(oldValues, newValues);
  if (operation !== entityChangeOperations.update) {
    return { changedFields: fields, oldValues, newValues };
  }
  return {
    changedFields: fields,
    oldValues: pickFields(oldValues, fields),
    newValues: pickFields(newValues, fields),
  };
}

export function createEntityChangeService(repository) {
  return Object.freeze({
    record(
      {
        schemaName,
        entityType,
        entityId,
        operation,
        context,
        oldValues = null,
        newValues = null,
        source = entityChangeSources.application,
        metadata,
      },
      client,
    ) {
      const snapshots = compactSnapshots(operation, oldValues, newValues);
      if (
        operation === entityChangeOperations.update &&
        snapshots.changedFields.length === 0
      ) {
        return Promise.resolve(null);
      }
      return repository.create(
        {
          schemaName,
          entityType,
          entityId: String(entityId).slice(0, 191),
          operation,
          source,
          actorUserId: context.actorUserId ?? null,
          companyId: context.companyId ?? null,
          actorMembershipId: context.membershipId ?? null,
          requestId: context.requestId,
          oldValues: snapshots.oldValues,
          newValues: snapshots.newValues,
          changedFields: snapshots.changedFields,
          metadata,
        },
        client,
      );
    },
    async list(query, now = new Date()) {
      const to = query.to ?? now;
      const from =
        query.from ?? new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);
      if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY_MS) {
        throw new AppError({
          code: errorCodes.validation,
          message: 'The date range must not exceed 90 days.',
          statusCode: 400,
        });
      }
      const result = await repository.list({ ...query, from, to });
      return {
        changes: result.items.map((item) => ({
          ...item,
          id: String(item.id),
        })),
        pagination: paginationMeta({ ...query, total: result.total }),
        range: { from: from.toISOString(), to: to.toISOString() },
      };
    },
    async get(id) {
      const change = await repository.findById(id);
      if (!change) {
        throw new AppError({
          code: errorCodes.notFound,
          message: 'The requested entity change was not found.',
          statusCode: 404,
        });
      }
      return { ...change, id: String(change.id) };
    },
  });
}
