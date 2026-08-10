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

export function companySnapshot(company) {
  if (!company) return null;
  return {
    id: company.id,
    code: company.code,
    legalName: company.legalName,
    commercialName: company.commercialName,
    nit: company.nit,
    nrc: company.nrc,
    countryId: company.countryId,
    departmentId: company.departmentId,
    municipalityId: company.municipalityId,
    districtId: company.districtId,
    addressLine: company.addressLine,
    phone: company.phone,
    email: company.email,
    website: company.website,
    logoStorageKey: company.logoStorageKey,
    status: company.status,
    defaultCurrencyCode: company.defaultCurrencyCode,
    timezone: company.timezone,
    locale: company.locale,
    economicActivities:
      company.economicActivities?.map(({ type, economicActivity }) => ({
        type,
        economicActivityId: economicActivity.id,
      })) ?? [],
    createdAt: iso(company.createdAt),
    updatedAt: iso(company.updatedAt),
  };
}

export function companyMembershipSnapshot(membership) {
  if (!membership) return null;
  return {
    id: membership.id,
    companyId: membership.companyId,
    userId: membership.userId,
    status: membership.status,
    securityVersion: membership.securityVersion,
    roleCodes: membership.roles?.map(({ role }) => role.code).sort() ?? [],
    joinedAt: iso(membership.joinedAt),
    createdAt: iso(membership.createdAt),
    updatedAt: iso(membership.updatedAt),
  };
}

export function companyRoleSnapshot(role) {
  if (!role) return null;
  return {
    id: role.id,
    companyId: role.companyId,
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
