import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createInventoryController(service, auditService) {
  return {
    async eligibleReceipts(request, response) {
      return sendSuccess(response, await service.eligibleReceipts(
        request.tenant.companyId, request.validated.query,
      ));
    },
    async postReceipt(request, response) {
      const operation = () => service.postReceipt(
        request.tenant.companyId,
        request.validated.params.purchaseId,
        request.validated.body,
        { actorUserId: request.auth.userId },
      );
      const result = auditService
        ? await auditService.execute({
            actorUserId: request.auth.userId,
            action: auditActions.inventoryReceiptPosted,
            resourceType: 'purchase',
            resourceId: request.validated.params.purchaseId,
            context: auditRequestContext(request),
            metadata: { companyId: request.tenant.companyId },
          }, operation)
        : await operation();
      return sendSuccess(response, result, { statusCode: 201 });
    },
  };
}
