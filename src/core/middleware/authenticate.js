import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

export async function authenticate(request, _response, next) {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return next(
      new AppError({
        code: errorCodes.authenticationRequired,
        message: 'Authentication is required.',
        statusCode: 401,
      }),
    );
  }

  const authService = request.app.locals.services?.auth;
  if (!authService) return next(new Error('Auth service is not configured.'));

  try {
    request.auth = await authService.authenticate(token);
    return next();
  } catch (error) {
    return next(error);
  }
}
