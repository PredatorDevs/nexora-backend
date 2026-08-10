import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { paginationMeta } from '../../core/validation/pagination.js';
export function createSessionsService(repository) {
  return {
    async list(query) {
      const result = await repository.list(query);
      return {
        sessions: result.items,
        pagination: paginationMeta({ ...query, total: result.total }),
      };
    },
    async revoke(id, actorUserId, currentSessionId) {
      const session = await repository.findById(id);
      if (!session)
        throw new AppError({
          code: errorCodes.notFound,
          message: 'The requested session was not found.',
          statusCode: 404,
        });
      if (id === currentSessionId)
        throw new AppError({
          code: errorCodes.conflict,
          message: 'Use logout to close your current session.',
          statusCode: 409,
          details: { reason: 'CURRENT_SESSION' },
        });
      return repository.revoke(id, actorUserId);
    },
  };
}
