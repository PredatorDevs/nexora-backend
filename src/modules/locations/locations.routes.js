import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createLocationsController } from './locations.controller.js';
import {
  createLocationBody,
  createLocationsBulkBody,
  locationIdParams,
  locationsListQuery,
  updateLocationBody,
  updateLocationStatusBody,
} from './locations.schemas.js';

export function createLocationsRouter(service, auditService) {
  const router = Router();
  const controller = createLocationsController(service, auditService);
  router.use(authenticate);
  router.get(
    '/',
    authorizeCompany('locations.read'),
    validate({ query: locationsListQuery }),
    controller.list,
  );
  router.post(
    '/bulk',
    authorizeCompany('locations.create'),
    validate({ body: createLocationsBulkBody }),
    controller.createBulk,
  );
  router.get(
    '/:id',
    authorizeCompany('locations.read'),
    validate({ params: locationIdParams }),
    controller.get,
  );
  router.post(
    '/',
    authorizeCompany('locations.create'),
    validate({ body: createLocationBody }),
    controller.create,
  );
  router.put(
    '/:id',
    authorizeCompany('locations.update'),
    validate({ params: locationIdParams, body: updateLocationBody }),
    controller.update,
  );
  router.patch(
    '/:id/status',
    authorizeCompany('locations.change_status'),
    validate({ params: locationIdParams, body: updateLocationStatusBody }),
    controller.changeStatus,
  );
  return router;
}
