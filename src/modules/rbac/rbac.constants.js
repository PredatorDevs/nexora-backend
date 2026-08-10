export const permissionCodes = Object.freeze([
  'users.read',
  'users.create',
  'users.update',
  'users.change_status',
  'users.assign_roles',
  'users.reset_password',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'roles.assign_permissions',
  'permissions.read',
  'audit.read',
  'sessions.read',
  'sessions.revoke',
  'address_dictionaries.read',
  'economic_activities.read',
  'companies.read',
  'companies.create',
  'companies.update',
  'companies.change_status',
  'company_members.read',
  'company_members.add',
  'company_members.change_status',
  'company_members.assign_roles',
  'company_roles.read',
  'company_roles.create',
  'company_roles.update',
  'company_roles.delete',
  'company_roles.assign_permissions',
]);

export const companyPermissionCodes = Object.freeze([
  'address_dictionaries.read',
  'economic_activities.read',
  'company_members.read',
  'company_members.add',
  'company_members.change_status',
  'company_members.assign_roles',
  'company_roles.read',
  'company_roles.create',
  'company_roles.update',
  'company_roles.delete',
  'company_roles.assign_permissions',
]);

const companyPermissions = new Set(companyPermissionCodes);

export function permissionScopeForCode(code) {
  return companyPermissions.has(code) ? 'COMPANY' : 'PLATFORM';
}

export const systemRoleCodes = Object.freeze({
  superAdmin: 'SUPER_ADMIN',
  admin: 'ADMIN',
  operator: 'OPERATOR',
  readOnly: 'READ_ONLY',
});

export const systemRoleDefinitions = Object.freeze([
  {
    code: systemRoleCodes.superAdmin,
    name: 'Super Administrator',
    description: 'Unrestricted access to every implemented permission.',
    permissions: permissionCodes,
  },
  {
    code: systemRoleCodes.admin,
    name: 'Administrator',
    description: 'Administrative access without deleting system roles.',
    permissions: permissionCodes.filter((code) => code !== 'roles.delete'),
  },
  {
    code: systemRoleCodes.operator,
    name: 'Operator',
    description: 'Day-to-day user and session operations.',
    permissions: [
      'users.read',
      'users.update',
      'users.change_status',
      'roles.read',
      'permissions.read',
      'sessions.read',
      'sessions.revoke',
      'address_dictionaries.read',
      'economic_activities.read',
      'companies.read',
    ],
  },
  {
    code: systemRoleCodes.readOnly,
    name: 'Read Only',
    description: 'Read-only access to administrative information.',
    permissions: [
      'users.read',
      'roles.read',
      'permissions.read',
      'audit.read',
      'sessions.read',
      'address_dictionaries.read',
      'economic_activities.read',
      'companies.read',
    ],
  },
]);

export const companySystemRoleCodes = Object.freeze({
  owner: 'OWNER',
  admin: 'ADMIN',
  operator: 'OPERATOR',
  readOnly: 'READ_ONLY',
});

export const companyRoleTemplates = Object.freeze([
  {
    code: companySystemRoleCodes.owner,
    name: 'Owner',
    description: 'Full company access and ownership safeguards.',
    permissions: companyPermissionCodes,
  },
  {
    code: companySystemRoleCodes.admin,
    name: 'Administrator',
    description: 'Company administration without deleting protected roles.',
    permissions: companyPermissionCodes.filter(
      (code) => code !== 'company_roles.delete',
    ),
  },
  {
    code: companySystemRoleCodes.operator,
    name: 'Operator',
    description: 'Shared catalog access for day-to-day operations.',
    permissions: ['address_dictionaries.read', 'economic_activities.read'],
  },
  {
    code: companySystemRoleCodes.readOnly,
    name: 'Read Only',
    description: 'Read-only access to shared business catalogs.',
    permissions: ['address_dictionaries.read', 'economic_activities.read'],
  },
]);

const permissionCodePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function isPermissionCode(value) {
  return typeof value === 'string' && permissionCodePattern.test(value);
}
