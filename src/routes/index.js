import { sendSuccess } from '../core/http/responses.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createUsersRouter } from '../modules/users/users.routes.js';
import { createRolesRouter } from '../modules/roles/roles.routes.js';
import { createPermissionsRouter } from '../modules/permissions/permissions.routes.js';
import { createSessionsRouter } from '../modules/sessions/sessions.routes.js';
import { createAuditRouter } from '../modules/audit/audit.routes.js';
import { createEntityChangeRouter } from '../modules/entity-changes/entity-change.routes.js';
import { createAddressDictionariesRouter } from '../modules/address-dictionaries/address-dictionaries.routes.js';
import { createEconomicActivitiesRouter } from '../modules/economic-activities/economic-activities.routes.js';
import { createCompaniesRouter } from '../modules/companies/companies.routes.js';
import { createCompanyAccessRouter } from '../modules/company-access/company-access.routes.js';
import { createBranchesRouter } from '../modules/branches/branches.routes.js';
import { createWarehouseCategoriesRouter } from '../modules/warehouse-categories/warehouse-categories.routes.js';
import { createWarehousesRouter } from '../modules/warehouses/warehouses.routes.js';
import { createLocationsRouter } from '../modules/locations/locations.routes.js';
import {
  createCompanyInvitationsManagementRouter,
  createCompanyInvitationsPublicRouter,
} from '../modules/company-invitations/company-invitations.routes.js';

export function registerRoutes(app) {
  app.get('/api/v1/health', (_request, response) => {
    return sendSuccess(response, { status: 'ok' });
  });

  if (app.locals.services.auth) {
    app.use(
      '/api/v1/auth',
      createAuthRouter({
        authService: app.locals.services.auth,
        rbacService: app.locals.services.rbac,
        auditService: app.locals.services.audit,
        settings: app.locals.settings,
      }),
    );
    app.use(
      '/api/v1/users',
      createUsersRouter(app.locals.services.users, app.locals.services.audit),
    );
    app.use(
      '/api/v1/roles',
      createRolesRouter(app.locals.services.roles, app.locals.services.audit),
    );
    app.use(
      '/api/v1/permissions',
      createPermissionsRouter(app.locals.services.permissions),
    );
    app.use(
      '/api/v1/sessions',
      createSessionsRouter(
        app.locals.services.sessions,
        app.locals.services.audit,
      ),
    );
    if (app.locals.services.addressDictionaries) {
      app.use(
        '/api/v1/address-dictionaries',
        createAddressDictionariesRouter(
          app.locals.services.addressDictionaries,
        ),
      );
    }
    if (app.locals.services.economicActivities) {
      app.use(
        '/api/v1/economic-activities',
        createEconomicActivitiesRouter(app.locals.services.economicActivities),
      );
    }
    if (app.locals.services.companies) {
      app.use(
        '/api/v1/companies',
        createCompaniesRouter(
          app.locals.services.companies,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.companyAccess) {
      app.use(
        '/api/v1/companies',
        createCompanyAccessRouter(
          app.locals.services.companyAccess,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.branches) {
      app.use(
        '/api/v1/branches',
        createBranchesRouter(
          app.locals.services.branches,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.warehouseCategories) {
      app.use(
        '/api/v1/warehouse-categories',
        createWarehouseCategoriesRouter(
          app.locals.services.warehouseCategories,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.warehouses) {
      app.use(
        '/api/v1/warehouses',
        createWarehousesRouter(
          app.locals.services.warehouses,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.locations) {
      app.use(
        '/api/v1/locations',
        createLocationsRouter(
          app.locals.services.locations,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.companyInvitations) {
      app.use(
        '/api/v1/companies',
        createCompanyInvitationsManagementRouter(
          app.locals.services.companyInvitations,
          app.locals.services.audit,
        ),
      );
      app.use(
        '/api/v1/invitations',
        createCompanyInvitationsPublicRouter(
          app.locals.services.companyInvitations,
          app.locals.services.audit,
        ),
      );
    }
    if (app.locals.services.audit) {
      app.use('/api/v1/audit', createAuditRouter(app.locals.services.audit));
    }
    if (app.locals.services.entityChanges) {
      app.use(
        '/api/v1/entity-changes',
        createEntityChangeRouter(app.locals.services.entityChanges),
      );
    }
  }
}
