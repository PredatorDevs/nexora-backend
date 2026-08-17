import { isPermissionCode } from '../../modules/rbac/rbac.constants.js';
import { AppError } from '../errors/app-error.js';
import { errorCodes } from '../errors/error-codes.js';

const authenticationRequired = () =>
  new AppError({
    code: errorCodes.authenticationRequired,
    message: 'Authentication is required.',
    statusCode: 401,
  });
const forbidden = (
  message = 'You do not have permission to perform this operation.',
) => new AppError({ code: errorCodes.forbidden, message, statusCode: 403 });

function validateRequest(request) {
  if (!request.auth?.userId) throw authenticationRequired();
  if (request.auth.mustChangePassword) {
    throw new AppError({
      code: errorCodes.passwordChangeRequired,
      message: 'You must change your password before continuing.',
      statusCode: 403,
    });
  }
}

function middleware(permissionCode, scope) {
  if (!isPermissionCode(permissionCode))
    throw new TypeError(`Invalid permission code: ${permissionCode}`);
  return async function authorizationMiddleware(request, _response, next) {
    try {
      validateRequest(request);
      const rbacService = request.app.locals.services?.rbac;
      if (!rbacService) throw new Error('RBAC service is not configured.');

      let permissions;
      if (scope === 'PLATFORM') {
        permissions =
          request.auth.platformPermissionCodes ??
          request.auth.permissionCodes ??
          (await (
            rbacService.getPlatformPermissionCodes ??
            rbacService.getPermissionCodes
          )(request.auth.userId));
        request.auth.platformPermissionCodes = permissions;
      } else {
        if (!request.tenant) {
          throw forbidden('Select an active company before continuing.');
        }
        const requestedCompanyId = request.params?.companyId;
        if (
          requestedCompanyId != null &&
          Number(requestedCompanyId) !== request.tenant.companyId
        ) {
          throw forbidden('The requested company is not the active company.');
        }
        permissions =
          request.auth.companyPermissionCodes ??
          (await rbacService.getCompanyPermissionCodes(
            request.tenant.membershipId,
            request.tenant.companyId,
          ));
        request.auth.companyPermissionCodes = permissions;
      }

      if (!permissions.includes(permissionCode)) throw forbidden();
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function authorizePlatform(permissionCode) {
  return middleware(permissionCode, 'PLATFORM');
}

export function authorizeCompany(permissionCode) {
  return middleware(permissionCode, 'COMPANY');
}

export function authorizeCompanyOrPlatform(
  permissionCode,
  platformPermissionCode = permissionCode,
) {
  if (
    !isPermissionCode(permissionCode) ||
    !isPermissionCode(platformPermissionCode)
  ) {
    throw new TypeError('Invalid permission code.');
  }
  return async function companyOrPlatformAuthorization(
    request,
    _response,
    next,
  ) {
    try {
      validateRequest(request);
      const rbacService = request.app.locals.services?.rbac;
      if (!rbacService) throw new Error('RBAC service is not configured.');

      if (request.tenant) {
        const companyPermissions =
          request.auth.companyPermissionCodes ??
          (await rbacService.getCompanyPermissionCodes(
            request.tenant.membershipId,
            request.tenant.companyId,
          ));
        request.auth.companyPermissionCodes = companyPermissions;
        if (companyPermissions.includes(permissionCode)) return next();
      }

      const platformPermissions =
        request.auth.platformPermissionCodes ??
        request.auth.permissionCodes ??
        (await (
          rbacService.getPlatformPermissionCodes ??
          rbacService.getPermissionCodes
        )(request.auth.userId));
      request.auth.platformPermissionCodes = platformPermissions;
      if (!platformPermissions.includes(platformPermissionCode)) {
        throw forbidden();
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Backward-compatible alias while platform administration routes are renamed.
export const authorize = authorizePlatform;
