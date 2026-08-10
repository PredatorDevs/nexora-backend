import { isPermissionCode } from '../../modules/rbac/rbac.constants.js';
import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

export function authorize(permissionCode) {
  if (!isPermissionCode(permissionCode))
    throw new TypeError(`Invalid permission code: ${permissionCode}`);
  return async function authorizationMiddleware(request, _response, next) {
    if (!request.auth?.userId)
      return next(
        new AppError({
          code: errorCodes.authenticationRequired,
          message: 'Authentication is required.',
          statusCode: 401,
        }),
      );
    if (request.auth.mustChangePassword)
      return next(
        new AppError({
          code: errorCodes.passwordChangeRequired,
          message: 'You must change your password before continuing.',
          statusCode: 403,
        }),
      );
    const rbacService = request.app.locals.services?.rbac;
    if (!rbacService) return next(new Error('RBAC service is not configured.'));
    const permissions =
      request.auth.permissionCodes ??
      (await rbacService.getPermissionCodes(request.auth.userId));
    request.auth.permissionCodes = permissions;
    if (!permissions.includes(permissionCode))
      return next(
        new AppError({
          code: errorCodes.forbidden,
          message: 'You do not have permission to perform this operation.',
          statusCode: 403,
        }),
      );
    return next();
  };
}
