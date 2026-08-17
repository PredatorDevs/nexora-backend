import { auditRequestContext } from '../../core/audit/request-context.js';
import { sendSuccess } from '../../core/http/responses.js';
import { auditActions } from '../audit/audit.constants.js';

export function createSuppliersController(service, auditService) {
  const context = (request) => ({
    actorUserId: request.auth.userId,
    requestId: request.id,
    companyId: request.tenant.companyId,
    membershipId: request.tenant.membershipId,
  });
  const audited = (request, resourceType, event, operation) => auditService
    ? auditService.execute({
        actorUserId: request.auth.userId,
        resourceType,
        context: auditRequestContext(request),
        ...event,
        metadata: { companyId: request.tenant.companyId, ...event.metadata },
      }, operation)
    : Promise.resolve().then(operation);
  return {
    async list(request, response) {
      const result = await service.list(request.tenant.companyId, request.validated.query);
      return sendSuccess(response, result.suppliers, { meta: { pagination: result.pagination } });
    },
    async get(request, response) {
      return sendSuccess(response, await service.get(request.tenant.companyId, request.validated.params.supplierId));
    },
    async create(request, response) {
      return sendSuccess(response, await audited(request, 'supplier', {
        action: auditActions.supplierCreated,
        resourceId: (value) => value.id,
      }, () => service.create(request.tenant.companyId, request.validated.body, context(request))), { statusCode: 201 });
    },
    async update(request, response) {
      return sendSuccess(response, await audited(request, 'supplier', {
        action: auditActions.supplierUpdated,
        resourceId: request.validated.params.supplierId,
        metadata: { fields: Object.keys(request.validated.body) },
      }, () => service.update(request.tenant.companyId, request.validated.params.supplierId, request.validated.body, context(request))));
    },
    async changeStatus(request, response) {
      return sendSuccess(response, await audited(request, 'supplier', {
        action: auditActions.supplierStatusChanged,
        resourceId: request.validated.params.supplierId,
        metadata: { isActive: request.validated.body.isActive },
      }, () => service.changeStatus(request.tenant.companyId, request.validated.params.supplierId, request.validated.body, context(request))));
    },
    async listContacts(request, response) {
      const result = await service.listContacts(
        request.tenant.companyId,
        request.validated.params.supplierId,
        request.validated.query,
      );
      return sendSuccess(response, result.contacts, { meta: { pagination: result.pagination } });
    },
    async getContact(request, response) {
      const { supplierId, contactId } = request.validated.params;
      return sendSuccess(response, await service.getContact(request.tenant.companyId, supplierId, contactId));
    },
    async createContact(request, response) {
      const { supplierId } = request.validated.params;
      return sendSuccess(response, await audited(request, 'supplier_contact', {
        action: auditActions.supplierContactCreated,
        resourceId: (value) => value.id,
        metadata: { supplierId },
      }, () => service.createContact(request.tenant.companyId, supplierId, request.validated.body, context(request))), { statusCode: 201 });
    },
    async updateContact(request, response) {
      const { supplierId, contactId } = request.validated.params;
      return sendSuccess(response, await audited(request, 'supplier_contact', {
        action: auditActions.supplierContactUpdated,
        resourceId: contactId,
        metadata: { supplierId, fields: Object.keys(request.validated.body) },
      }, () => service.updateContact(request.tenant.companyId, supplierId, contactId, request.validated.body, context(request))));
    },
    async changeContactStatus(request, response) {
      const { supplierId, contactId } = request.validated.params;
      return sendSuccess(response, await audited(request, 'supplier_contact', {
        action: auditActions.supplierContactStatusChanged,
        resourceId: contactId,
        metadata: { supplierId, isActive: request.validated.body.isActive },
      }, () => service.changeContactStatus(request.tenant.companyId, supplierId, contactId, request.validated.body, context(request))));
    },
    async setPrimaryContact(request, response) {
      const { supplierId, contactId } = request.validated.params;
      return sendSuccess(response, await audited(request, 'supplier_contact', {
        action: auditActions.supplierContactPrimaryChanged,
        resourceId: contactId,
        metadata: { supplierId },
      }, () => service.setPrimaryContact(request.tenant.companyId, supplierId, contactId, request.validated.body, context(request))));
    },
  };
}
