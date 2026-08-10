import { createApp } from '../../src/create-app.js';
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
import { createEntityChangeRepository } from '../../src/modules/entity-changes/entity-change.repository.js';
import { createEntityChangeService } from '../../src/modules/entity-changes/entity-change.service.js';
import { createAddressDictionariesRepository } from '../../src/modules/address-dictionaries/address-dictionaries.repository.js';
import { createEconomicActivitiesRepository } from '../../src/modules/economic-activities/economic-activities.repository.js';
import { createCompaniesRepository } from '../../src/modules/companies/companies.repository.js';
import { createCompaniesService } from '../../src/modules/companies/companies.service.js';

export function createTestApplication({
  prisma,
  environment,
  origin = 'http://localhost:5173',
  refreshCookieName = 'test_refresh',
}) {
  const runInTransaction = (operation, options) =>
    prisma.$transaction(operation, options);
  const entityChangeService = createEntityChangeService(
    createEntityChangeRepository(prisma),
  );
  const rbac = createRbacService({
    repository: createRbacRepository(prisma),
    runInTransaction,
    entityChangeService,
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
      entityChanges: entityChangeService,
      users: createUsersService({
        repository: createUsersRepository(prisma),
        rbacService: rbac,
        passwordHasher: hashPassword,
        entityChangeService,
        runInTransaction,
      }),
      roles: createRolesService({
        repository: createRolesRepository(prisma),
        rbacService: rbac,
        entityChangeService,
        runInTransaction,
      }),
      permissions: createPermissionsRepository(prisma),
      sessions: createSessionsService(createSessionsRepository(prisma)),
      addressDictionaries: createAddressDictionariesRepository(prisma),
      economicActivities: createEconomicActivitiesRepository(prisma),
      companies: createCompaniesService({
        repository: createCompaniesRepository(prisma),
        entityChangeService,
        runInTransaction,
      }),
    },
    settings: {
      auth: { refreshCookieName },
      cookie: { secure: false, sameSite: 'lax' },
      http: { loginRateLimit: { windowMs: 60_000, limit: 20 } },
    },
  });
}
