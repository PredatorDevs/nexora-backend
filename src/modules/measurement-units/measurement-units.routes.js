import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompanyOrPlatform } from '../../core/middleware/authorize.js';
import { sendSuccess } from '../../core/http/responses.js';
import { validate } from '../../core/middleware/validate.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { measurementUnitsListQuery } from './measurement-units.schemas.js';

export function createMeasurementUnitsRouter(repository) {
  const router = Router();
  router.use(
    authenticate,
    authorizeCompanyOrPlatform('measurement_units.read', 'companies.read'),
  );

  router.get(
    '/',
    validate({ query: measurementUnitsListQuery }),
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
