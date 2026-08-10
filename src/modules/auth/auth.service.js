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

export function createAuthService({
  repository,
  accessTokens,
  refreshTokens,
  passwordVerifier,
  passwordHasher,
  refreshTokenExpiresInDays,
  now = () => new Date(),
}) {
  const createAccessToken = (user, sessionId) =>
    accessTokens.sign({
      userId: user.id,
      sessionId,
      securityVersion: user.securityVersion,
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

      await repository.createSession({
        id: sessionId,
        familyId: sessionId,
        userId: user.id,
        refreshTokenHash: refreshTokens.hash(refreshToken),
        ipAddress,
        userAgent,
        expiresAt,
      });

      return {
        accessToken: await createAccessToken(user, sessionId),
        refreshCookie: refreshTokens.serialize(sessionId, refreshToken),
        refreshExpiresAt: expiresAt,
        user: publicUser(user),
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
        accessToken: await createAccessToken(session.user, session.id),
        refreshCookie: refreshTokens.serialize(session.id, nextToken),
        refreshExpiresAt: session.expiresAt,
        userId: session.userId,
        sessionId: session.id,
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
        session.user.securityVersion !== claims.securityVersion
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
        accessToken: await createAccessToken(updated, sessionId),
      };
    },
  };
}
