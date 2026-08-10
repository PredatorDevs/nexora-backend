import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createUsersController } from './users.controller.js';
import {
  createUserBody,
  replaceUserRolesBody,
  resetUserPasswordBody,
  updateUserBody,
  updateUserStatusBody,
  userIdParams,
  usersListQuery,
} from './users.schemas.js';
export function createUsersRouter(service, auditService) {
  const router = Router();
  const controller = createUsersController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorize('users.read'),
    validate({ query: usersListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorize('users.read'),
    validate({ params: userIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorize('users.create'),
    validate({ body: createUserBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorize('users.update'),
    validate({ params: userIdParams, body: updateUserBody }),
    controller.update,
  );
  router.post(
    '/:id/reset-password',
    authorize('users.reset_password'),
    validate({ params: userIdParams, body: resetUserPasswordBody }),
    controller.resetPassword,
  );
  router.patch(
    '/:id/status',
    authorize('users.change_status'),
    validate({ params: userIdParams, body: updateUserStatusBody }),
    controller.changeStatus,
  );
  router.put(
    '/:id/roles',
    authorize('users.assign_roles'),
    validate({ params: userIdParams, body: replaceUserRolesBody }),
    controller.replaceRoles,
  );
  return router;
}
