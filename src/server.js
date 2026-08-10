import { createApp } from './create-app.js';
import { loadEnvironment } from './config/environment.js';
import { createLogger } from './config/logger.js';
import { initializePrisma } from './database/prisma.js';
import { runInTransaction } from './database/transaction.js';
import { createRbacRepository } from './modules/rbac/rbac.repository.js';
import { createRbacService } from './modules/rbac/rbac.service.js';
import { createAccessTokenService } from './core/security/access-token.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  matchesRefreshToken,
  parseRefreshCookie,
  serializeRefreshCookie,
} from './core/security/refresh-token.js';
import { verifyPassword } from './core/security/password.js';
import { createAuthRepository } from './modules/auth/auth.repository.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { hashPassword } from './core/security/password.js';
import { createUsersRepository } from './modules/users/users.repository.js';
import { createUsersService } from './modules/users/users.service.js';
import { createRolesRepository } from './modules/roles/roles.repository.js';
import { createRolesService } from './modules/roles/roles.service.js';
import { createPermissionsRepository } from './modules/permissions/permissions.repository.js';
import { createSessionsRepository } from './modules/sessions/sessions.repository.js';
import { createSessionsService } from './modules/sessions/sessions.service.js';
import { createAuditRepository } from './modules/audit/audit.repository.js';
import { createAuditService } from './modules/audit/audit.service.js';
import { createEntityChangeRepository } from './modules/entity-changes/entity-change.repository.js';
import { createEntityChangeService } from './modules/entity-changes/entity-change.service.js';
import { createAddressDictionariesRepository } from './modules/address-dictionaries/address-dictionaries.repository.js';
import { createEconomicActivitiesRepository } from './modules/economic-activities/economic-activities.repository.js';
import { createCompaniesRepository } from './modules/companies/companies.repository.js';
import { createCompaniesService } from './modules/companies/companies.service.js';
import { provisionCompanyRoles } from './modules/company-access/company-role-templates.js';
import { createCompanyAccessRepository } from './modules/company-access/company-access.repository.js';
import { createCompanyAccessService } from './modules/company-access/company-access.service.js';
import {
  configureServerTimeouts,
  createGracefulShutdown,
  registerShutdownSignals,
} from './core/server/lifecycle.js';

const isVercel = process.env.VERCEL === '1';
const environment = loadEnvironment(
  isVercel
    ? {
        ...process.env,
        SERVE_FRONTEND: 'false',
        FRONTEND_DIST_PATH: '',
      }
    : process.env,
);
const logger = createLogger({ level: environment.logging.level });
const prisma = initializePrisma({ databaseUrl: environment.databaseUrl });
const entityChangeService = createEntityChangeService(
  createEntityChangeRepository(prisma),
);
const rbacRepository = createRbacRepository(prisma);
const rbacService = createRbacService({
  repository: rbacRepository,
  runInTransaction,
  entityChangeService,
});
const authRepository = createAuthRepository(prisma);
const accessTokens = createAccessTokenService({
  secret: environment.auth.accessTokenSecret,
  expiresIn: environment.auth.accessTokenExpiresIn,
  issuer: environment.auth.accessTokenIssuer,
  audience: environment.auth.accessTokenAudience,
});
const authService = createAuthService({
  repository: authRepository,
  accessTokens,
  refreshTokens: {
    generate: generateRefreshToken,
    hash: hashRefreshToken,
    matches: matchesRefreshToken,
    parse: parseRefreshCookie,
    serialize: serializeRefreshCookie,
  },
  passwordVerifier: verifyPassword,
  passwordHasher: hashPassword,
  refreshTokenExpiresInDays: environment.auth.refreshTokenExpiresInDays,
});
const usersService = createUsersService({
  repository: createUsersRepository(prisma),
  rbacService,
  passwordHasher: hashPassword,
  entityChangeService,
  runInTransaction,
  provisionRoles: provisionCompanyRoles,
});
const rolesService = createRolesService({
  repository: createRolesRepository(prisma),
  rbacService,
  entityChangeService,
  runInTransaction,
});
const permissionsRepository = createPermissionsRepository(prisma);
const sessionsService = createSessionsService(createSessionsRepository(prisma));
const auditService = createAuditService(createAuditRepository(prisma));
const companiesService = createCompaniesService({
  repository: createCompaniesRepository(prisma),
  entityChangeService,
  runInTransaction,
});
const companyAccessService = createCompanyAccessService({
  repository: createCompanyAccessRepository(prisma),
  entityChangeService,
  runInTransaction,
});
const app = createApp({
  trustProxy: environment.http.trustProxy,
  allowedOrigins: environment.cors.allowedOrigins,
  jsonBodyLimit: environment.http.jsonBodyLimit,
  rateLimit: environment.http.rateLimit,
  logger,
  services: {
    rbac: rbacService,
    auth: authService,
    users: usersService,
    roles: rolesService,
    permissions: permissionsRepository,
    sessions: sessionsService,
    audit: auditService,
    entityChanges: entityChangeService,
    addressDictionaries: createAddressDictionariesRepository(prisma),
    economicActivities: createEconomicActivitiesRepository(prisma),
    companies: companiesService,
    companyAccess: companyAccessService,
  },
  settings: {
    auth: environment.auth,
    cookie: environment.cookie,
    http: { loginRateLimit: environment.http.loginRateLimit },
  },
  // Vercel serves public/** from its CDN instead of the Function filesystem.
  frontend: isVercel
    ? { enabled: false, distPath: null }
    : environment.frontend,
  rootRedirectPath: isVercel ? '/login' : null,
});

// Vercel owns the HTTP listener and reuses this exported Express application.
if (!isVercel) {
  try {
    await prisma.$connect();
    const server = app.listen(environment.port, () => {
      logger.info({ port: environment.port }, 'HTTP server started');
    });
    configureServerTimeouts(server, environment.http.serverTimeouts);
    const shutdown = createGracefulShutdown({
      server,
      disconnect: () => prisma.$disconnect(),
      logger,
      timeoutMs: environment.http.serverTimeouts.shutdownTimeoutMs,
    });
    registerShutdownSignals(shutdown);
    server.on('error', (error) => {
      logger.fatal({ errorName: error?.name }, 'HTTP server failed');
      void shutdown('SERVER_ERROR');
    });
  } catch (error) {
    logger.fatal(
      { errorName: error?.name },
      'Database connection failed during startup',
    );
    process.exitCode = 1;
  }
}

export default app;
