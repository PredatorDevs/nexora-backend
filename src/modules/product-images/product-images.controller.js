import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createProductImagesController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, event, operation) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: request.auth.userId,
            resourceType: 'product_image',
            context: auditRequestContext(request),
            ...event,
            metadata: {
              companyId: request.tenant.companyId,
              productId: request.validated.params.productId,
              ...event.metadata,
            },
          },
          operation,
        )
      : Promise.resolve().then(operation);

  return {
    async list(request, response) {
      return sendSuccess(
        response,
        await service.list(
          request.tenant.companyId,
          request.validated.params.productId,
        ),
      );
    },
    async create(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.productImageCreated,
            resourceId: (value) => value.id,
          },
          () =>
            service.create(
              request.tenant.companyId,
              request.validated.params.productId,
              request.validated.body,
              context(request),
            ),
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
            action: auditActions.productImageUpdated,
            resourceId: request.validated.params.imageId,
          },
          () =>
            service.update(
              request.tenant.companyId,
              request.validated.params.productId,
              request.validated.params.imageId,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
    async setPrimary(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.productImagePrimaryChanged,
            resourceId: request.validated.params.imageId,
          },
          () =>
            service.setPrimary(
              request.tenant.companyId,
              request.validated.params.productId,
              request.validated.params.imageId,
              request.validated.body,
              context(request),
            ),
        ),
      );
    },
    async reorder(request, response) {
      return sendSuccess(
        response,
        await audited(
          request,
          {
            action: auditActions.productImagesReordered,
            resourceId: request.validated.params.productId,
          },
          () =>
            service.reorder(
              request.tenant.companyId,
              request.validated.params.productId,
              request.validated.body.imageIds,
              context(request),
            ),
        ),
      );
    },
    async remove(request, response) {
      await audited(
        request,
        {
          action: auditActions.productImageDeleted,
          resourceId: request.validated.params.imageId,
        },
        () =>
          service.remove(
            request.tenant.companyId,
            request.validated.params.productId,
            request.validated.params.imageId,
            request.validated.body,
            context(request),
          ),
      );
      return sendSuccess(response, null);
    },
  };
}
