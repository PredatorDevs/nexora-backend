import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

export function apiNotFound(request, _response, next) {
  next(
    new AppError({
      code: errorCodes.notFound,
      message: 'The requested API resource was not found.',
      statusCode: 404,
      details: { method: request.method, path: request.originalUrl },
    }),
  );
}
