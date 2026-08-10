import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createRolesController } from './roles.controller.js';
import {
  createRoleBody,
  deleteRoleQuery,
  replaceRolePermissionsBody,
  roleIdParams,
  rolesListQuery,
  updateRoleBody,
} from './roles.schemas.js';
export function createRolesRouter(service, auditService) {
  const router = Router();
  const controller = createRolesController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorize('roles.read'),
    validate({ query: rolesListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorize('roles.read'),
    validate({ params: roleIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorize('roles.create'),
    validate({ body: createRoleBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorize('roles.update'),
    validate({ params: roleIdParams, body: updateRoleBody }),
    controller.update,
  );
  router.delete(
    '/:id',
    authorize('roles.delete'),
    validate({ params: roleIdParams, query: deleteRoleQuery }),
    controller.delete,
  );
  router.put(
    '/:id/permissions',
    authorize('roles.assign_permissions'),
    validate({ params: roleIdParams, body: replaceRolePermissionsBody }),
    controller.replacePermissions,
  );
  return router;
}
