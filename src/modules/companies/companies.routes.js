import { Router } from 'express';

import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createCompaniesController } from './companies.controller.js';
import {
  companiesListQuery,
  companyIdParams,
  createCompanyBody,
  updateCompanyBody,
  updateCompanyStatusBody,
} from './companies.schemas.js';

export function createCompaniesRouter(service, auditService) {
  const router = Router();
  const controller = createCompaniesController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorize('companies.read'),
    validate({ query: companiesListQuery }),
    controller.list,
  );
  router.get(
    '/:id',
    authorize('companies.read'),
    validate({ params: companyIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorize('companies.create'),
    validate({ body: createCompanyBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorize('companies.update'),
    validate({ params: companyIdParams, body: updateCompanyBody }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    authorize('companies.change_status'),
    validate({ params: companyIdParams, body: updateCompanyStatusBody }),
    controller.changeStatus,
  );
  return router;
}
