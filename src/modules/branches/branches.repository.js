const branchSelect = {
  id: true,
  companyId: true,
  code: true,
  name: true,
  isHeadquarters: true,
  countryId: true,
  departmentId: true,
  municipalityId: true,
  districtId: true,
  foreignAdministrativeArea: true,
  foreignLocality: true,
  addressLine: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  country: { select: { id: true, name: true, abbreviation: true } },
  department: { select: { id: true, name: true } },
  municipality: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
};
export function createBranchesRepository(prisma) {
  return {
    async list(
      companyId,
      { page, pageSize, search, status, isHeadquarters, sortBy, sortOrder },
    ) {
      const where = {
        companyId,
        ...(status ? { status } : {}),
        ...(isHeadquarters === undefined ? {} : { isHeadquarters }),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { name: { contains: search } },
                { addressLine: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.branch.findMany({
          where,
          select: branchSelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.branch.count({ where }),
      ]);
      return { items, total };
    },
    find(companyId, id, client = prisma) {
      return client.branch.findFirst({
        where: { id, companyId },
        select: branchSelect,
      });
    },
    findCompany(companyId, client = prisma) {
      return client.company.findUnique({
        where: { id: companyId },
        select: { id: true, status: true },
      });
    },
    async findAddress(
      { countryId, departmentId, municipalityId, districtId },
      client = prisma,
    ) {
      const [country, district] = await Promise.all([
        client.country.findFirst({
          where: { id: countryId, isActive: true },
          select: { id: true, abbreviation: true },
        }),
        departmentId && municipalityId && districtId
          ? client.district.findFirst({
          where: {
            id: districtId,
            municipalityId,
            isActive: true,
            municipality: {
              departmentId,
              isActive: true,
              department: { isActive: true },
            },
          },
          select: { id: true },
            })
          : Promise.resolve(null),
      ]);
      return { country, district };
    },
    clearHeadquarters(companyId, exceptId, client = prisma) {
      return client.branch.updateMany({
        where: {
          companyId,
          isHeadquarters: true,
          ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        data: { isHeadquarters: false },
      });
    },
    create(companyId, data, client = prisma) {
      return client.branch.create({
        data: { companyId, ...data },
        select: branchSelect,
      });
    },
    async update(companyId, id, expectedUpdatedAt, data, client = prisma) {
      const result = await client.branch.updateMany({
        where: { id, companyId, updatedAt: expectedUpdatedAt },
        data,
      });
      return result.count === 1 ? this.find(companyId, id, client) : null;
    },
  };
}
