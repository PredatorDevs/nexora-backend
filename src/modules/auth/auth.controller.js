import { sendSuccess } from '../../core/http/responses.js';
import { auditRequestContext } from '../../core/audit/request-context.js';
import { auditActions } from '../audit/audit.constants.js';
import {
  createClearCookieOptions,
  createRefreshCookieOptions,
} from './auth.cookies.js';

function requestContext(request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get('user-agent')?.slice(0, 512) ?? null,
  };
}

export function createAuthController({
  authService,
  rbacService,
  auditService,
  settings,
}) {
  const audited = (event, operation) =>
    auditService
      ? auditService.execute(event, operation)
      : Promise.resolve().then(operation);
  const setRefreshCookie = (response, value, expiresAt) => {
    response.cookie(
      settings.auth.refreshCookieName,
      value,
      createRefreshCookieOptions({ cookie: settings.cookie, expiresAt }),
    );
  };
  const clearRefreshCookie = (response) => {
    response.clearCookie(
      settings.auth.refreshCookieName,
      createClearCookieOptions(settings.cookie),
    );
  };

  return {
    async login(request, response) {
      const result = await audited(
        {
          action: auditActions.loginSucceeded,
          failureAction: auditActions.loginFailed,
          actorUserId: (value) => value?.user.id ?? null,
          resourceType: 'auth_session',
          resourceId: null,
          context: auditRequestContext(request),
        },
        () =>
          authService.login({
            ...request.validated.body,
            ...requestContext(request),
          }),
      );
      setRefreshCookie(response, result.refreshCookie, result.refreshExpiresAt);
      return sendSuccess(response, {
        accessToken: result.accessToken,
        user: result.user,
        activeMembership: result.activeMembership,
        memberships: result.memberships,
        requiresCompanySelection: result.requiresCompanySelection,
      });
    },

    async refresh(request, response) {
      const result = await audited(
        {
          action: auditActions.tokenRefreshed,
          actorUserId: (value) => value?.userId ?? null,
          resourceType: 'auth_session',
          resourceId: (value) => value?.sessionId ?? null,
          context: auditRequestContext(request),
        },
        () =>
          authService.refresh(request.cookies[settings.auth.refreshCookieName]),
      );
      setRefreshCookie(response, result.refreshCookie, result.refreshExpiresAt);
      return sendSuccess(response, { accessToken: result.accessToken });
    },

    async logout(request, response) {
      await audited(
        {
          action: auditActions.logout,
          actorUserId: request.auth.userId,
          resourceType: 'auth_session',
          resourceId: request.auth.sessionId,
          context: auditRequestContext(request),
        },
        () => authService.logout(request.auth.sessionId),
      );
      clearRefreshCookie(response);
      return sendSuccess(response, null);
    },

    async logoutAll(request, response) {
      await audited(
        {
          action: auditActions.logoutAll,
          actorUserId: request.auth.userId,
          resourceType: 'user',
          resourceId: request.auth.userId,
          context: auditRequestContext(request),
        },
        () => authService.logoutAll(request.auth.userId),
      );
      clearRefreshCookie(response);
      return sendSuccess(response, null);
    },

    async me(request, response) {
      return sendSuccess(response, {
        ...(await authService.getUser(request.auth.userId)),
        activeContext: request.auth.companyId
          ? {
              companyId: request.auth.companyId,
              membershipId: request.auth.membershipId,
            }
          : null,
      });
    },

    async companies(request, response) {
      return sendSuccess(
        response,
        await authService.listCompanies(request.auth.userId),
      );
    },

    async switchCompany(request, response) {
      const result = await audited(
        {
          action: auditActions.companySwitched,
          actorUserId: request.auth.userId,
          resourceType: 'auth_session',
          resourceId: request.auth.sessionId,
          context: auditRequestContext(request),
          metadata: {
            previousCompanyId: request.auth.companyId,
            targetCompanyId: request.validated.body.companyId,
          },
        },
        () =>
          authService.switchCompany({
            userId: request.auth.userId,
            sessionId: request.auth.sessionId,
            companyId: request.validated.body.companyId,
            refreshCookie: request.cookies[settings.auth.refreshCookieName],
          }),
      );
      setRefreshCookie(response, result.refreshCookie, result.refreshExpiresAt);
      return sendSuccess(response, {
        accessToken: result.accessToken,
        activeMembership: result.activeMembership,
      });
    },

    async permissions(request, response) {
      const platformPermissions = await rbacService.getPlatformPermissionCodes(
        request.auth.userId,
      );
      const companyPermissions = request.auth.membershipId
        ? await rbacService.getCompanyPermissionCodes(
            request.auth.membershipId,
            request.auth.companyId,
          )
        : [];
      return sendSuccess(response, {
        scope: request.auth.membershipId ? 'COMPANY' : 'PLATFORM',
        permissions: request.auth.membershipId
          ? companyPermissions
          : platformPermissions,
        platformPermissions,
        companyPermissions,
      });
    },

    async updateProfile(request, response) {
      return sendSuccess(
        response,
        await audited(
          {
            action: auditActions.profileUpdated,
            actorUserId: request.auth.userId,
            resourceType: 'user',
            resourceId: request.auth.userId,
            metadata: { fields: ['displayName'] },
            context: auditRequestContext(request),
          },
          () =>
            authService.updateProfile(
              request.auth.userId,
              request.validated.body,
            ),
        ),
      );
    },

    async changePassword(request, response) {
      const result = await audited(
        {
          action: auditActions.passwordChanged,
          actorUserId: request.auth.userId,
          resourceType: 'user',
          resourceId: request.auth.userId,
          context: auditRequestContext(request),
        },
        () =>
          authService.changePassword({
            userId: request.auth.userId,
            sessionId: request.auth.sessionId,
            ...request.validated.body,
          }),
      );
      return sendSuccess(response, result);
    },
  };
}
