import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendSuccess } from '../../core/http/responses.js';
import { paginationMeta } from '../../core/validation/pagination.js';
import { permissionsListQuery } from './permissions.schemas.js';
export function createPermissionsRouter(repository) {
  const router = Router();
  router.use(authenticate);
  router.get(
    '/',
    authorize('permissions.read'),
    validate({ query: permissionsListQuery }),
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
