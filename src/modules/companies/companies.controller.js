import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createCompaniesController(service, auditService) {
  const changeContext = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
  });
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            resourceType: 'company',
            context: auditRequestContext(request),
            ...event,
          },
          operation,
        )
      : Promise.resolve().then(operation);

  return {
    async list(request, response) {
      const result = await service.list(request.validated.query);
      return sendSuccess(response, result.companies, {
        meta: { pagination: result.pagination },
      });
    },
    async get(request, response) {
      return sendSuccess(
        response,
        await service.get(request.validated.params.id),
      );
    },
    async create(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyCreated,
            resourceId: (company) => company.id,
          },
          () => service.create(request.validated.body, changeContext(request)),
        ),
        { statusCode: 201 },
      );
    },
    async update(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyUpdated,
            resourceId: request.validated.params.id,
            metadata: { fields: Object.keys(request.validated.body) },
          },
          () =>
            service.update(
              request.validated.params.id,
              request.validated.body,
              changeContext(request),
            ),
        ),
      );
    },
    async changeStatus(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.companyStatusChanged,
            resourceId: request.validated.params.id,
            metadata: { status: request.validated.body.status },
          },
          () =>
            service.changeStatus(
              request.validated.params.id,
              request.validated.body,
              changeContext(request),
            ),
        ),
      );
    },
  };
}
