import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createInventoryController(service, auditService) {
  return {
    async listStock(request, response) {
      const result = await service.listStock(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.stock, { meta: { pagination: result.pagination } });
    },
    async listKardex(request, response) {
      const result = await service.listKardex(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.movements, { meta: { pagination: result.pagination } });
    },
    async listCosts(request, response) {
      const result = await service.listCosts(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.costs, { meta: { pagination: result.pagination } });
    },
    async listLots(request, response) {
      const result = await service.listLots(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.lots, { meta: { pagination: result.pagination } });
    },
    async getLot(request, response) {
      return sendSuccess(response, await service.getLot(
        request.tenant.companyId, request.validated.params.id,
      ));
    },
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
    async assignLocation(request, response) {
      const id = request.validated.params.id;
      const operation = () => service.assignLocation(
        request.tenant.companyId, id, request.validated.body,
        { actorUserId: request.auth.userId },
      );
      const result = auditService ? await auditService.execute({
        actorUserId: request.auth.userId,
        action: auditActions.inventoryLocationAssigned,
        resourceType: 'inventory_lot', resourceId: id,
        context: auditRequestContext(request),
        metadata: { companyId: request.tenant.companyId, ...request.validated.body },
      }, operation) : await operation();
      return sendSuccess(response, result);
    },
    async printLabels(request, response) {
      const id = request.validated.params.id;
      const operation = () => service.printLabels(
        request.tenant.companyId, id, request.validated.body,
        { actorUserId: request.auth.userId },
      );
      const result = auditService ? await auditService.execute({
        actorUserId: request.auth.userId,
        action: auditActions.inventoryLabelsPrinted,
        resourceType: 'inventory_lot', resourceId: id,
        context: auditRequestContext(request),
        metadata: { companyId: request.tenant.companyId, quantity: request.validated.body.quantity },
      }, operation) : await operation();
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.buffer.length,
      });
      return response.send(result.buffer);
    },
  };
}
