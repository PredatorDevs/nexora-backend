import { sendSuccess } from '../../core/http/responses.js';
import { auditRequestContext } from '../../core/audit/request-context.js';
import { auditActions } from '../audit/audit.constants.js';
export function createCompanyInvitationsController(service, auditService) {
  const audited = (request, event, operation) => auditService
    ? auditService.execute({ context: auditRequestContext(request), ...event }, operation)
    : Promise.resolve().then(operation);
  return {
    async list(req, res) { const result = await service.list(req.validated.params.companyId, req.validated.query); return sendSuccess(res, result.invitations, { meta: { pagination: result.pagination } }); },
    async invite(req, res) { return sendSuccess(res, await audited(req, { action: auditActions.companyInvitationCreated, actorUserId: req.auth.userId, companyId: req.auth.companyId, actorMembershipId: req.auth.membershipId, resourceType: 'company_invitation', resourceId: (value) => value.id }, () => service.invite(req.validated.params.companyId, req.validated.body, req.auth.userId)), { statusCode: 201 }); },
    async preview(req, res) { return sendSuccess(res, await service.preview(req.validated.params.token)); },
    async accept(req, res) { return sendSuccess(res, await audited(req, { action: auditActions.companyInvitationAccepted, actorUserId: null, resourceType: 'company_invitation', resourceId: (value) => value.invitationId }, () => service.accept(req.validated.params.token, req.validated.body))); },
    async revoke(req, res) { await audited(req, { action: auditActions.companyInvitationRevoked, actorUserId: req.auth.userId, companyId: req.auth.companyId, actorMembershipId: req.auth.membershipId, resourceType: 'company_invitation', resourceId: req.validated.params.invitationId }, () => service.revoke(req.validated.params.companyId, req.validated.params.invitationId)); return sendSuccess(res, null); },
  };
}
