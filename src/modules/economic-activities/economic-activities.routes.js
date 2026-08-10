import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendSuccess } from '../../core/http/responses.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { economicActivitiesListQuery } from './economic-activities.schemas.js';

export function createEconomicActivitiesRouter(repository) {
  const router = Router();
  router.use(authenticate, authorizeCompany('economic_activities.read'));

  router.get(
    '/',
    validate({ query: economicActivitiesListQuery }),
    async (request, response) => {
      const query = request.validated.query;
      const result = await repository.list(query);
      return sendSuccess(response, result.items, {
        meta: { pagination: paginationMeta({ ...query, total: result.total }) },
      });
    },
  );

  return router;
}
