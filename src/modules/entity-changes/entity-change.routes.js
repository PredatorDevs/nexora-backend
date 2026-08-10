import { Router } from 'express';

import { sendSuccess } from '../../core/http/responses.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import {
  entityChangeIdParams,
  entityChangeListQuery,
} from './entity-change.schemas.js';

export function createEntityChangeRouter(service) {
  const router = Router();
  router.use(authenticate, authorize('audit.read'));
  router.get(
    '/',
    validate({ query: entityChangeListQuery }),
    async (request, response) => {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.changes, {
        meta: { pagination: result.pagination, range: result.range },
      });
    },
  );
  router.get(
    '/:id',
    validate({ params: entityChangeIdParams }),
    async (request, response) =>
      sendSuccess(response, await service.get(request.validated.params.id)),
  );
  return router;
}
