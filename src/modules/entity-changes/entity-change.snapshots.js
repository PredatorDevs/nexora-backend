function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

export function userSnapshot(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    securityVersion: user.securityVersion,
    mustChangePassword: user.mustChangePassword,
    roleCodes: user.roles?.map(({ role }) => role.code).sort() ?? [],
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
  };
}

export function roleSnapshot(role) {
  if (!role) return null;
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissionCodes:
      role.permissions?.map(({ permission }) => permission.code).sort() ?? [],
    createdAt: iso(role.createdAt),
    updatedAt: iso(role.updatedAt),
  };
}
