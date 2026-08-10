import { AppError } from './app-error.js';
import { errorCodes } from './error-codes.js';

export function concurrencyConflict(resource, currentUpdatedAt = null) {
  return new AppError({
    code: errorCodes.conflict,
    message: `The ${resource} changed after it was loaded. Refresh and try again.`,
    statusCode: 409,
    details: {
      reason: 'STALE_WRITE',
      ...(currentUpdatedAt ? { currentUpdatedAt } : {}),
    },
  });
}
