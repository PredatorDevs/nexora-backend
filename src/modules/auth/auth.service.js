import { randomUUID } from 'node:crypto';

import { AppError } from '../../core/errors/app-error.js';
import { errorCodes } from '../../core/errors/error-codes.js';
import { dummyPasswordHash } from '../../core/security/password.js';

function authError(code, message) {
  return new AppError({ code, message, statusCode: 401 });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
  };
}

function publicMembership(membership) {
  return {
    id: membership.id,
    companyId: membership.companyId,
    company: membership.company,
  };
}

export function createAuthService({
  repository,
  accessTokens,
  refreshTokens,
  passwordVerifier,
  passwordHasher,
  refreshTokenExpiresInDays,
  now = () => new Date(),
}) {
  const createAccessToken = (user, session) =>
    accessTokens.sign({
      userId: user.id,
      sessionId: session.id,
      securityVersion: user.securityVersion,
      companyId: session.companyId ?? null,
      membershipId: session.membershipId ?? null,
      membershipSecurityVersion:
        session.membership?.securityVersion ??
        session.membershipSecurityVersion ??
        null,
    });

  return {
    async login({ email, password, ipAddress, userAgent }) {
      const user = await repository.findUserByEmail(email);
      const passwordMatches = await passwordVerifier(
        user?.passwordHash ?? dummyPasswordHash,
        password,
      );

      if (!user || !passwordMatches || user.status !== 'ACTIVE') {
        throw authError(
          errorCodes.invalidCredentials,
          'The provided credentials are invalid.',
        );
      }

      const sessionId = randomUUID();
      const refreshToken = refreshTokens.generate();
      const issuedAt = now();
      const expiresAt = new Date(issuedAt);
      expiresAt.setUTCDate(expiresAt.getUTCDate() + refreshTokenExpiresInDays);

      const memberships = await repository.findActiveMemberships(user.id);
      const activeMembership = memberships.length === 1 ? memberships[0] : null;
      await repository.createSession({
        id: sessionId,
        familyId: sessionId,
        userId: user.id,
        refreshTokenHash: refreshTokens.hash(refreshToken),
        ipAddress,
        userAgent,
        expiresAt,
        companyId: activeMembership?.companyId ?? null,
        membershipId: activeMembership?.id ?? null,
      });

      const sessionContext = {
        id: sessionId,
        companyId: activeMembership?.companyId ?? null,
        membershipId: activeMembership?.id ?? null,
        membershipSecurityVersion: activeMembership?.securityVersion ?? null,
      };

      return {
        accessToken: await createAccessToken(user, sessionContext),
        refreshCookie: refreshTokens.serialize(sessionId, refreshToken),
        refreshExpiresAt: expiresAt,
        user: publicUser(user),
        activeMembership: activeMembership
          ? publicMembership(activeMembership)
          : null,
        memberships: memberships.map(publicMembership),
        requiresCompanySelection: memberships.length > 1,
      };
    },

    async refresh(refreshCookie) {
      const parsed = refreshTokens.parse(refreshCookie);
      if (!parsed) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }

      const session = await repository.findSessionById(parsed.sessionId);
      if (!session) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }

      const currentTime = now();
      if (!refreshTokens.matches(parsed.token, session.refreshTokenHash)) {
        await repository.revokeFamily(
          session.familyId,
          'REFRESH_TOKEN_REUSE',
          currentTime,
        );
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }

      if (session.revokedAt) {
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }
      if (session.expiresAt <= currentTime) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session has expired.',
        );
      }
      if (session.user.status !== 'ACTIVE') {
        await repository.revokeFamily(
          session.familyId,
          'USER_INACTIVE',
          currentTime,
        );
        throw authError(
          errorCodes.authenticationRequired,
          'Authentication is required.',
        );
      }
      if (
        session.membershipId != null &&
        (!session.membership ||
          session.membership.userId !== session.userId ||
          session.membership.companyId !== session.companyId ||
          session.membership.status !== 'ACTIVE' ||
          session.company?.status !== 'ACTIVE')
      ) {
        await repository.revokeFamily(
          session.familyId,
          'MEMBERSHIP_INACTIVE',
          currentTime,
        );
        throw authError(
          errorCodes.authenticationRequired,
          'Authentication is required.',
        );
      }

      const nextToken = refreshTokens.generate();
      const rotated = await repository.rotateSession({
        sessionId: session.id,
        currentHash: session.refreshTokenHash,
        nextHash: refreshTokens.hash(nextToken),
        now: currentTime,
      });

      if (!rotated) {
        await repository.revokeFamily(
          session.familyId,
          'REFRESH_TOKEN_REUSE',
          currentTime,
        );
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }

      return {
        accessToken: await createAccessToken(session.user, session),
        refreshCookie: refreshTokens.serialize(session.id, nextToken),
        refreshExpiresAt: session.expiresAt,
        userId: session.userId,
        sessionId: session.id,
        companyId: session.companyId,
        membershipId: session.membershipId,
      };
    },

    async authenticate(accessToken) {
      let claims;
      try {
        claims = await accessTokens.verify(accessToken);
      } catch {
        throw authError(
          errorCodes.authenticationRequired,
          'Authentication is required.',
        );
      }

      const session = await repository.findSessionById(claims.sessionId);
      const currentTime = now();
      if (
        !session ||
        session.userId !== claims.userId ||
        session.revokedAt ||
        session.expiresAt <= currentTime ||
        session.user.status !== 'ACTIVE' ||
        session.user.securityVersion !== claims.securityVersion ||
        session.companyId !== claims.companyId ||
        session.membershipId !== claims.membershipId ||
        (session.membershipId != null &&
          (!session.membership ||
            session.membership.userId !== session.userId ||
            session.membership.companyId !== session.companyId ||
            session.membership.status !== 'ACTIVE' ||
            session.company?.status !== 'ACTIVE' ||
            session.membership.securityVersion !==
              claims.membershipSecurityVersion))
      ) {
        throw authError(
          errorCodes.authenticationRequired,
          'Authentication is required.',
        );
      }

      return {
        userId: session.userId,
        sessionId: session.id,
        securityVersion: session.user.securityVersion,
        mustChangePassword: session.user.mustChangePassword,
        companyId: session.companyId,
        membershipId: session.membershipId,
        membershipSecurityVersion: session.membership?.securityVersion ?? null,
      };
    },

    async listCompanies(userId) {
      return (await repository.findActiveMemberships(userId)).map(
        publicMembership,
      );
    },

    async switchCompany({ userId, sessionId, companyId, refreshCookie }) {
      const parsed = refreshTokens.parse(refreshCookie);
      if (!parsed || parsed.sessionId !== sessionId) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }
      const session = await repository.findSessionById(sessionId);
      const currentTime = now();
      if (
        !session ||
        session.userId !== userId ||
        session.revokedAt ||
        session.expiresAt <= currentTime
      ) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }
      if (!refreshTokens.matches(parsed.token, session.refreshTokenHash)) {
        await repository.revokeFamily(
          session.familyId,
          'REFRESH_TOKEN_REUSE',
          currentTime,
        );
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }
      const membership = await repository.findActiveMembership(
        userId,
        companyId,
      );
      if (!membership) {
        throw new AppError({
          code: errorCodes.forbidden,
          message: 'The requested company is not available to this user.',
          statusCode: 403,
        });
      }
      const nextToken = refreshTokens.generate();
      const switched = await repository.switchCompany({
        sessionId,
        userId,
        currentHash: session.refreshTokenHash,
        nextHash: refreshTokens.hash(nextToken),
        companyId: membership.companyId,
        membershipId: membership.id,
        now: currentTime,
      });
      if (!switched) {
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }
      return {
        accessToken: await createAccessToken(session.user, {
          id: session.id,
          companyId: membership.companyId,
          membershipId: membership.id,
          membershipSecurityVersion: membership.securityVersion,
        }),
        refreshCookie: refreshTokens.serialize(session.id, nextToken),
        refreshExpiresAt: session.expiresAt,
        userId,
        sessionId,
        previousCompanyId: session.companyId,
        activeMembership: publicMembership(membership),
      };
    },

    async switchPlatform({
      userId,
      sessionId,
      refreshCookie,
      hasPlatformAccess,
    }) {
      if (!hasPlatformAccess) {
        throw new AppError({
          code: errorCodes.forbidden,
          message: 'Platform administration is not available to this user.',
          statusCode: 403,
        });
      }
      const parsed = refreshTokens.parse(refreshCookie);
      if (!parsed || parsed.sessionId !== sessionId) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }
      const session = await repository.findSessionById(sessionId);
      const currentTime = now();
      if (
        !session ||
        session.userId !== userId ||
        session.revokedAt ||
        session.expiresAt <= currentTime
      ) {
        throw authError(
          errorCodes.sessionExpired,
          'The refresh session is invalid or expired.',
        );
      }
      if (!refreshTokens.matches(parsed.token, session.refreshTokenHash)) {
        await repository.revokeFamily(
          session.familyId,
          'REFRESH_TOKEN_REUSE',
          currentTime,
        );
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }
      const nextToken = refreshTokens.generate();
      const switched = await repository.switchPlatform({
        sessionId,
        userId,
        currentHash: session.refreshTokenHash,
        nextHash: refreshTokens.hash(nextToken),
        now: currentTime,
      });
      if (!switched) {
        throw authError(
          errorCodes.sessionRevoked,
          'The refresh session has been revoked.',
        );
      }
      return {
        accessToken: await createAccessToken(session.user, {
          id: session.id,
          companyId: null,
          membershipId: null,
          membershipSecurityVersion: null,
        }),
        refreshCookie: refreshTokens.serialize(session.id, nextToken),
        refreshExpiresAt: session.expiresAt,
        userId,
        sessionId,
        previousCompanyId: session.companyId,
        activeMembership: null,
      };
    },

    async logout(sessionId) {
      await repository.revokeSession(sessionId, 'USER_LOGOUT', now());
    },

    async logoutAll(userId) {
      await repository.revokeAllForUser(userId, 'USER_LOGOUT_ALL', now());
    },

    async getUser(userId) {
      const user = await repository.findUserById(userId);
      if (!user || user.status !== 'ACTIVE') {
        throw authError(
          errorCodes.authenticationRequired,
          'Authentication is required.',
        );
      }
      return publicUser(user);
    },
    async updateProfile(userId, { displayName }) {
      return publicUser(await repository.updateProfile(userId, displayName));
    },
    async changePassword({ userId, sessionId, currentPassword, newPassword }) {
      const user = await repository.findUserById(userId);
      const credentials = user
        ? await repository.findUserByEmail(user.email)
        : null;
      if (
        !credentials ||
        !(await passwordVerifier(credentials.passwordHash, currentPassword))
      ) {
        throw authError(
          errorCodes.invalidCredentials,
          'The current password is invalid.',
        );
      }
      const updated = await repository.changePassword({
        userId,
        currentSessionId: sessionId,
        passwordHash: await passwordHasher(newPassword),
        now: now(),
      });
      return {
        user: publicUser(updated),
        accessToken: await createAccessToken(
          updated,
          await repository.findSessionById(sessionId),
        ),
      };
    },
  };
}
