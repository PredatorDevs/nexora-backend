import { createApp } from '../../src/app.js';
import { createAccessTokenService } from '../../src/core/security/access-token.js';
import {
  hashPassword,
  verifyPassword,
} from '../../src/core/security/password.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
  parseRefreshCookie,
  serializeRefreshCookie,
} from '../../src/core/security/refresh-token.js';
import { createAuditRepository } from '../../src/modules/audit/audit.repository.js';
import { createAuditService } from '../../src/modules/audit/audit.service.js';
import { createAuthRepository } from '../../src/modules/auth/auth.repository.js';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createPermissionsRepository } from '../../src/modules/permissions/permissions.repository.js';
import { createRbacRepository } from '../../src/modules/rbac/rbac.repository.js';
import { createRbacService } from '../../src/modules/rbac/rbac.service.js';
import { createRolesRepository } from '../../src/modules/roles/roles.repository.js';
import { createRolesService } from '../../src/modules/roles/roles.service.js';
import { createSessionsRepository } from '../../src/modules/sessions/sessions.repository.js';
import { createSessionsService } from '../../src/modules/sessions/sessions.service.js';
import { createUsersRepository } from '../../src/modules/users/users.repository.js';
import { createUsersService } from '../../src/modules/users/users.service.js';

export function createTestApplication({
  prisma,
  environment,
  origin = 'http://localhost:5173',
  refreshCookieName = 'test_refresh',
}) {
  const rbac = createRbacService({
    repository: createRbacRepository(prisma),
    runInTransaction: (operation, options) =>
      prisma.$transaction(operation, options),
  });
  const auth = createAuthService({
    repository: createAuthRepository(prisma),
    accessTokens: createAccessTokenService({
      secret: environment.auth.accessTokenSecret,
      expiresIn: environment.auth.accessTokenExpiresIn,
      issuer: environment.auth.accessTokenIssuer,
      audience: environment.auth.accessTokenAudience,
    }),
    refreshTokens: {
      generate: generateRefreshToken,
      hash: hashRefreshToken,
      matches: matchesRefreshToken,
      parse: parseRefreshCookie,
      serialize: serializeRefreshCookie,
    },
    passwordVerifier: verifyPassword,
    passwordHasher: hashPassword,
    refreshTokenExpiresInDays: 1,
  });
  const audit = createAuditService(createAuditRepository(prisma));

  return createApp({
    allowedOrigins: [origin],
    services: {
      auth,
      rbac,
      audit,
      users: createUsersService({
        repository: createUsersRepository(prisma),
        rbacService: rbac,
        passwordHasher: hashPassword,
      }),
      roles: createRolesService({
        repository: createRolesRepository(prisma),
        rbacService: rbac,
      }),
      permissions: createPermissionsRepository(prisma),
      sessions: createSessionsService(createSessionsRepository(prisma)),
    },
    settings: {
      auth: { refreshCookieName },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
}
