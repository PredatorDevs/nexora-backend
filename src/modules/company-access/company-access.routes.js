import { Router } from 'express';

import { authenticate } from '../../core/middleware/authenticate.js';
import { authorizeCompany } from '../../core/middleware/authorize.js';
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
    authorizeCompany('company_members.read'),
    validate({ params: companyAccessParams, query: membershipsListQuery }),
    controller.listMemberships,
  );
  router.get(
    '/:companyId/members/:membershipId',
    authorizeCompany('company_members.read'),
    validate({ params: membershipParams }),
    controller.getMembership,
  );
  router.post(
    '/:companyId/members',
    authorizeCompany('company_members.add'),
    validate({ params: companyAccessParams, body: addMembershipBody }),
    controller.addMembership,
  );
  router.patch(
    '/:companyId/members/:membershipId/status',
    authorizeCompany('company_members.change_status'),
    validate({ params: membershipParams, body: changeMembershipStatusBody }),
    controller.changeMembershipStatus,
  );
  router.put(
    '/:companyId/members/:membershipId/roles',
    authorizeCompany('company_members.assign_roles'),
    validate({ params: membershipParams, body: replaceMembershipRolesBody }),
    controller.replaceMembershipRoles,
  );

  router.get(
    '/:companyId/roles',
    authorizeCompany('company_roles.read'),
    validate({ params: companyAccessParams, query: companyRolesListQuery }),
    controller.listRoles,
  );
  router.get(
    '/:companyId/roles/:roleId',
    authorizeCompany('company_roles.read'),
    validate({ params: companyRoleParams }),
    controller.getRole,
  );
  router.post(
    '/:companyId/roles',
    authorizeCompany('company_roles.create'),
    validate({ params: companyAccessParams, body: createCompanyRoleBody }),
    controller.createRole,
  );
  router.put(
    '/:companyId/roles/:roleId',
    authorizeCompany('company_roles.update'),
    validate({ params: companyRoleParams, body: updateCompanyRoleBody }),
    controller.updateRole,
  );
  router.delete(
    '/:companyId/roles/:roleId',
    authorizeCompany('company_roles.delete'),
    validate({ params: companyRoleParams, query: deleteCompanyRoleQuery }),
    controller.deleteRole,
  );
  router.put(
    '/:companyId/roles/:roleId/permissions',
    authorizeCompany('company_roles.assign_permissions'),
    validate({
      params: companyRoleParams,
      body: replaceCompanyRolePermissionsBody,
    }),
    controller.replaceRolePermissions,
  );
  return router;
}
