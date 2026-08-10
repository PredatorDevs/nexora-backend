import { Router } from 'express';

import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validate } from '../../core/middleware/validate.js';
import { createCompanyAccessController } from './company-access.controller.js';
import {
  addMembershipBody,
  changeMembershipStatusBody,
  companyAccessParams,
  companyRoleParams,
  companyRolesListQuery,
  createCompanyRoleBody,
  deleteCompanyRoleQuery,
  membershipParams,
  membershipsListQuery,
  replaceCompanyRolePermissionsBody,
  replaceMembershipRolesBody,
  updateCompanyRoleBody,
} from './company-access.schemas.js';

export function createCompanyAccessRouter(service, auditService) {
  const router = Router();
  const controller = createCompanyAccessController(service, auditService);
  router.use(authenticate);

  router.get(
    '/:companyId/members',
    authorize('company_members.read'),
    validate({ params: companyAccessParams, query: membershipsListQuery }),
    controller.listMemberships,
  );
  router.get(
    '/:companyId/members/:membershipId',
    authorize('company_members.read'),
    validate({ params: membershipParams }),
    controller.getMembership,
  );
  router.post(
    '/:companyId/members',
    authorize('company_members.add'),
    validate({ params: companyAccessParams, body: addMembershipBody }),
    controller.addMembership,
  );
  router.patch(
    '/:companyId/members/:membershipId/status',
    authorize('company_members.change_status'),
    validate({ params: membershipParams, body: changeMembershipStatusBody }),
    controller.changeMembershipStatus,
  );
  router.put(
    '/:companyId/members/:membershipId/roles',
    authorize('company_members.assign_roles'),
    validate({ params: membershipParams, body: replaceMembershipRolesBody }),
    controller.replaceMembershipRoles,
  );

  router.get(
    '/:companyId/roles',
    authorize('company_roles.read'),
    validate({ params: companyAccessParams, query: companyRolesListQuery }),
    controller.listRoles,
  );
  router.get(
    '/:companyId/roles/:roleId',
    authorize('company_roles.read'),
    validate({ params: companyRoleParams }),
    controller.getRole,
  );
  router.post(
    '/:companyId/roles',
    authorize('company_roles.create'),
    validate({ params: companyAccessParams, body: createCompanyRoleBody }),
    controller.createRole,
  );
  router.put(
    '/:companyId/roles/:roleId',
    authorize('company_roles.update'),
    validate({ params: companyRoleParams, body: updateCompanyRoleBody }),
    controller.updateRole,
  );
  router.delete(
    '/:companyId/roles/:roleId',
    authorize('company_roles.delete'),
    validate({ params: companyRoleParams, query: deleteCompanyRoleQuery }),
    controller.deleteRole,
  );
  router.put(
    '/:companyId/roles/:roleId/permissions',
    authorize('company_roles.assign_permissions'),
    validate({
      params: companyRoleParams,
      body: replaceCompanyRolePermissionsBody,
    }),
    controller.replaceRolePermissions,
  );
  return router;
}
