import { Router } from 'express';

import { authenticate } from '../../core/middleware/authenticate.js';
import { createGeneralRateLimit } from '../../core/middleware/rate-limit.js';
import { requireTrustedOrigin } from '../../core/middleware/trusted-origin.js';
import { validate } from '../../core/middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import {
  changePasswordSchema,
  loginSchema,
  switchCompanySchema,
  updateProfileSchema,
} from './auth.schemas.js';

export function createAuthRouter({
  authService,
  rbacService,
  auditService,
  settings,
}) {
  const router = Router();
  const controller = createAuthController({
    authService,
    rbacService,
    auditService,
    settings,
  });
  const loginRateLimit = createGeneralRateLimit(settings.http.loginRateLimit);

  router.post(
    '/login',
    requireTrustedOrigin,
    loginRateLimit,
    validate({ body: loginSchema }),
    controller.login,
  );
  router.post('/refresh', requireTrustedOrigin, controller.refresh);
  router.post('/logout', requireTrustedOrigin, authenticate, controller.logout);
  router.post(
    '/logout-all',
    requireTrustedOrigin,
    authenticate,
    controller.logoutAll,
  );
  router.get('/me', authenticate, controller.me);
  router.get('/companies', authenticate, controller.companies);
  router.post(
    '/switch-company',
    requireTrustedOrigin,
    authenticate,
    validate({ body: switchCompanySchema }),
    controller.switchCompany,
  );
  router.get('/permissions', authenticate, controller.permissions);
  router.put(
    '/profile',
    requireTrustedOrigin,
    authenticate,
    validate({ body: updateProfileSchema }),
    controller.updateProfile,
  );
  router.post(
    '/change-password',
    requireTrustedOrigin,
    authenticate,
    validate({ body: changePasswordSchema }),
    controller.changePassword,
  );

  return router;
}
