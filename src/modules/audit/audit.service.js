import { paginationMeta } from '../../core/validation/pagination.js';

const blockedMetadataKeys = /(password|token|cookie|secret|authorization)/i;

function sanitizeMetadata(value, depth = 0) {
  if (value == null || depth > 4) return null;
  if (Array.isArray(value))
    return value.slice(0, 50).map((item) => sanitizeMetadata(item, depth + 1));
  if (typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !blockedMetadataKeys.test(key))
        .slice(0, 50)
        .map(([key, item]) => [key, sanitizeMetadata(item, depth + 1)]),
    );
  if (typeof value === 'string') return value.slice(0, 500);
  return value;
}

const resolve = (value, result) =>
  typeof value === 'function' ? value(result) : value;

export function createAuditService(repository) {
  const service = {
    record(event) {
      return repository.create({
        actorUserId: event.actorUserId ?? null,
        companyId: event.companyId ?? event.context.companyId ?? null,
        actorMembershipId:
          event.actorMembershipId ?? event.context.membershipId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId:
          event.resourceId == null
            ? null
            : String(event.resourceId).slice(0, 191),
        result: event.result,
        requestId: event.context.requestId,
        ipAddress: event.context.ipAddress,
        userAgent: event.context.userAgent,
        metadata: event.metadata ? sanitizeMetadata(event.metadata) : undefined,
      });
    },
    async execute(event, operation) {
      let result;
      try {
        result = await operation();
      } catch (error) {
        await service.record({
          ...event,
          action: event.failureAction ?? resolve(event.action),
          actorUserId: resolve(event.actorUserId),
          resourceId: resolve(event.resourceId),
          result: 'FAILURE',
          metadata: {
            ...(resolve(event.metadata) ?? {}),
            errorCode: error?.code ?? 'INTERNAL_SERVER_ERROR',
          },
        });
        throw error;
      }
      await service.record({
        ...event,
        action: resolve(event.action, result),
        actorUserId: resolve(event.actorUserId, result),
        resourceId: resolve(event.resourceId, result),
        metadata: resolve(event.metadata, result),
        result: 'SUCCESS',
      });
      return result;
    },
    async list(query) {
      const result = await repository.list(query);
      return {
        logs: result.items.map((item) => ({ ...item, id: String(item.id) })),
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
  };
  return service;
}
