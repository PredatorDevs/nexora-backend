import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

export function requireTrustedOrigin(request, _response, next) {
  const origin = request.get('origin');
  const allowedOrigins = request.app.locals.settings?.allowedOrigins ?? [];

  if (!origin || !allowedOrigins.includes(origin)) {
    return next(
      new AppError({
        code: errorCodes.forbidden,
        message: 'The request origin is not allowed.',
        statusCode: 403,
      }),
    );
  }

  return next();
}
