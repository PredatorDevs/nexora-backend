import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createBranchesController } from './branches.controller.js';
import {
  branchIdParams,
  branchesListQuery,
  createBranchBody,
  updateBranchBody,
  updateBranchStatusBody,
} from './branches.schemas.js';
export function createBranchesRouter(service, auditService) {
  const router = Router();
  const controller = createBranchesController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('branches.read'),
    validate({ query: branchesListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorizeCompany('branches.read'),
    validate({ params: branchIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('branches.create'),
    validate({ body: createBranchBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('branches.update'),
    validate({ params: branchIdParams, body: updateBranchBody }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    authorizeCompany('branches.change_status'),
    validate({ params: branchIdParams, body: updateBranchStatusBody }),
    controller.changeStatus,
  );
  return router;
}
