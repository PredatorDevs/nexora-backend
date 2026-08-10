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
]);

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

const permissionCodePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function isPermissionCode(value) {
  return typeof value === 'string' && permissionCodePattern.test(value);
}
