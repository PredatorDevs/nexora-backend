import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditRequestContext } from '../../core/audit/request-context.js';
import { auditActions } from '../audit/audit.constants.js';
import { sessionIdParams, sessionsListQuery } from './sessions.schemas.js';
export function createSessionsRouter(service, auditService) {
  const router = Router();
  router.use(authenticate);
  router.get(
    '/',
    authorize('sessions.read'),
    validate({ query: sessionsListQuery }),
    async (request, response) => {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.sessions, {
        meta: { pagination: result.pagination },
      });
    },
  );
  router.delete(
    '/:id',
    authorize('sessions.revoke'),
    validate({ params: sessionIdParams }),
    async (request, response) => {
      const operation = () =>
        service.revoke(
          request.validated.params.id,
          request.auth.userId,
          request.auth.sessionId,
        );
      const result = auditService
        ? await auditService.execute(
            {
              action: auditActions.sessionRevoked,
              actorUserId: request.auth.userId,
              resourceType: 'auth_session',
              resourceId: request.validated.params.id,
              context: auditRequestContext(request),
            },
            operation,
          )
        : await operation();
      return sendSuccess(response, result);
    },
  );
  return router;
}
