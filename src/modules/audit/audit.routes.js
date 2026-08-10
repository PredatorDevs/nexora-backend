import { Router } from 'express';

import { sendSuccess } from '../../core/http/responses.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { auditListQuery } from './audit.schemas.js';

export function createAuditRouter(service) {
  const router = Router();
  router.get(
    '/',
    authenticate,
    authorize('audit.read'),
    validate({ query: auditListQuery }),
    async (request, response) => {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.logs, {
        meta: { pagination: result.pagination },
      });
    },
  );
  return router;
}
