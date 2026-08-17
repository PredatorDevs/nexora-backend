import { Router } from 'express';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
import { requireTrustedOrigin } from '../../core/middleware/trusted-origin.js';
import { validate } from '../../core/middleware/validate.js';
import { createCompanyInvitationsController } from './company-invitations.controller.js';
import { acceptInvitationBody, createInvitationBody, invitationCompanyParams, invitationParams, invitationsListQuery, invitationTokenParams } from './company-invitations.schemas.js';
export function createCompanyInvitationsManagementRouter(service, auditService) {
  const router = Router(); const controller = createCompanyInvitationsController(service, auditService);
  router.use(authenticate);
  router.get('/:companyId/invitations', authorizeCompany('company_members.read'), validate({ params: invitationCompanyParams, query: invitationsListQuery }), controller.list);
  router.post('/:companyId/invitations', authorizeCompany('company_members.add'), validate({ params: invitationCompanyParams, body: createInvitationBody }), controller.invite);
  router.delete('/:companyId/invitations/:invitationId', authorizeCompany('company_members.change_status'), validate({ params: invitationParams }), controller.revoke);
  return router;
}
export function createCompanyInvitationsPublicRouter(service, auditService) {
  const router = Router(); const controller = createCompanyInvitationsController(service, auditService);
  router.get('/:token', validate({ params: invitationTokenParams }), controller.preview);
  router.post('/:token/accept', requireTrustedOrigin, validate({ params: invitationTokenParams, body: acceptInvitationBody }), controller.accept);
  return router;
}
