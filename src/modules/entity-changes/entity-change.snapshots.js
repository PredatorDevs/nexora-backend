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
    foreignAdministrativeArea: company.foreignAdministrativeArea,
    foreignLocality: company.foreignLocality,
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

export function branchSnapshot(branch) {
  if (!branch) return null;
  return {
    id: branch.id,
    companyId: branch.companyId,
    code: branch.code,
    name: branch.name,
    isHeadquarters: branch.isHeadquarters,
    countryId: branch.countryId,
    departmentId: branch.departmentId,
    municipalityId: branch.municipalityId,
    districtId: branch.districtId,
    foreignAdministrativeArea: branch.foreignAdministrativeArea,
    foreignLocality: branch.foreignLocality,
    addressLine: branch.addressLine,
    phone: branch.phone,
    email: branch.email,
    status: branch.status,
    createdAt: iso(branch.createdAt),
    updatedAt: iso(branch.updatedAt),
  };
}

export function warehouseCategorySnapshot(value) {
  if (!value) return null;
  return {
    id: value.id,
    companyId: value.companyId,
    code: value.code,
    name: value.name,
    description: value.description,
    isActive: value.isActive,
    createdAt: iso(value.createdAt),
    updatedAt: iso(value.updatedAt),
  };
}

export function warehouseSnapshot(value) {
  if (!value) return null;
  return {
    id: value.id,
    companyId: value.companyId,
    branchId: value.branchId,
    warehouseCategoryId: value.warehouseCategoryId,
    code: value.code,
    name: value.name,
    description: value.description,
    isActive: value.isActive,
    createdAt: iso(value.createdAt),
    updatedAt: iso(value.updatedAt),
  };
}

export function locationSnapshot(value) {
  if (!value) return null;
  return {
    id: value.id,
    companyId: value.companyId,
    warehouseId: value.warehouseId,
    code: value.code,
    aisle: value.aisle,
    rack: value.rack,
    level: value.level,
    position: value.position,
    capacity: value.capacity?.toString() ?? null,
    capacityUnit: value.capacityUnit,
    notes: value.notes,
    isActive: value.isActive,
    createdAt: iso(value.createdAt),
    updatedAt: iso(value.updatedAt),
  };
}

export function supplierSnapshot(value) {
  if (!value) return null;
  return {
    id: value.id,
    companyId: value.companyId,
    code: value.code,
    name: value.name,
    nit: value.nit,
    nrc: value.nrc,
    countryId: value.countryId,
    departmentId: value.departmentId,
    municipalityId: value.municipalityId,
    districtId: value.districtId,
    foreignAdministrativeArea: value.foreignAdministrativeArea,
    foreignLocality: value.foreignLocality,
    addressLine: value.addressLine,
    phone: value.phone,
    email: value.email,
    website: value.website,
    isActive: value.isActive,
    createdAt: iso(value.createdAt),
    updatedAt: iso(value.updatedAt),
  };
}

export function supplierContactSnapshot(value) {
  if (!value) return null;
  return {
    id: value.id,
    companyId: value.companyId,
    supplierId: value.supplierId,
    fullName: value.fullName,
    jobTitle: value.jobTitle,
    department: value.department,
    phone: value.phone,
    email: value.email,
    isPrimary: value.isPrimary,
    validFrom: iso(value.validFrom),
    validUntil: iso(value.validUntil),
    notes: value.notes,
    isActive: value.isActive,
    createdAt: iso(value.createdAt),
    updatedAt: iso(value.updatedAt),
  };
}
