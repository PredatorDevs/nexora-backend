import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';
export function createProductCategoriesController(service, auditService) {
  const context = (r) => ({
    actorUserId: r.auth.userId,
    requestId: r.id,
    companyId: r.tenant.companyId,
    membershipId: r.tenant.membershipId,
  });
  const audited = (r, event, op) =>
    auditService
      ? auditService.execute(
          {
            actorUserId: r.auth.userId,
            resourceType: 'product_category',
            context: auditRequestContext(r),
            ...event,
            metadata: { companyId: r.tenant.companyId, ...event.metadata },
          },
          op,
        )
      : Promise.resolve().then(op);
  return {
    async list(r, s) {
      const x = await service.list(r.tenant.companyId, r.validated.query);
      return sendSuccess(s, x.productCategories, {
        meta: { pagination: x.pagination },
      });
    },
    async get(r, s) {
      return sendSuccess(
        s,
        await service.get(r.tenant.companyId, r.validated.params.id),
      );
    },
    async create(r, s) {
      return sendSuccess(
        s,
        await audited(
          r,
          {
            action: auditActions.productCategoryCreated,
            resourceId: (v) => v.id,
          },
          () =>
            service.create(r.tenant.companyId, r.validated.body, context(r)),
        ),
        { statusCode: 201 },
      );
    },
    async update(r, s) {
      return sendSuccess(
        s,
        await audited(
          r,
          {
            action: auditActions.productCategoryUpdated,
            resourceId: r.validated.params.id,
          },
          () =>
            service.update(
              r.tenant.companyId,
              r.validated.params.id,
              r.validated.body,
              context(r),
            ),
        ),
      );
    },
    async changeStatus(r, s) {
      return sendSuccess(
        s,
        await audited(
          r,
          {
            action: auditActions.productCategoryStatusChanged,
            resourceId: r.validated.params.id,
          },
          () =>
            service.changeStatus(
              r.tenant.companyId,
              r.validated.params.id,
              r.validated.body,
              context(r),
            ),
        ),
      );
    },
  };
}
