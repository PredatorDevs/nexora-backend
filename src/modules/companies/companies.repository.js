const companySelect = {
  id: true,
  code: true,
  legalName: true,
  commercialName: true,
  nit: true,
  nrc: true,
  countryId: true,
  departmentId: true,
  municipalityId: true,
  districtId: true,
  foreignAdministrativeArea: true,
  foreignLocality: true,
  addressLine: true,
  phone: true,
  email: true,
  website: true,
  logoStorageKey: true,
  status: true,
  defaultCurrencyCode: true,
  timezone: true,
  locale: true,
  createdAt: true,
  updatedAt: true,
  country: { select: { id: true, name: true, abbreviation: true } },
  department: { select: { id: true, name: true } },
  municipality: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
  economicActivities: {
    select: {
      type: true,
      economicActivity: { select: { id: true, code: true, name: true } },
    },
    orderBy: { type: 'asc' },
  },
};

export function createCompaniesRepository(prisma) {
  return {
    async list({ page, pageSize, search, status, sortBy, sortOrder }) {
      const where = {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { legalName: { contains: search } },
                { commercialName: { contains: search } },
                { nit: { contains: search } },
                { nrc: { contains: search } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.company.findMany({
          where,
          select: companySelect,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.company.count({ where }),
      ]);
      return { items, total };
    },

    findById(id, client = prisma) {
      return client.company.findUnique({
        where: { id },
        select: companySelect,
      });
    },

    async findAddressContext(
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

    findActiveEconomicActivities(ids, client = prisma) {
      return client.economicActivity.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true },
      });
    },

    create(data, client = prisma) {
      const { economicActivities, ...company } = data;
      return client.company.create({
        data: {
          ...company,
          economicActivities: { create: economicActivities },
        },
        select: companySelect,
      });
    },

    async update(id, expectedUpdatedAt, data, client = prisma) {
      const { economicActivities, ...company } = data;
      const claimed = await client.company.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data:
          Object.keys(company).length > 0 ? company : { updatedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      if (economicActivities) {
        await client.companyEconomicActivity.deleteMany({
          where: { companyId: id },
        });
        await client.companyEconomicActivity.createMany({
          data: economicActivities.map((activity) => ({
            companyId: id,
            ...activity,
          })),
        });
      }
      return this.findById(id, client);
    },

    async updateStatus(id, expectedUpdatedAt, status, client = prisma) {
      const updated = await client.company.updateMany({
        where: { id, updatedAt: expectedUpdatedAt },
        data: { status },
      });
      return updated.count === 1 ? this.findById(id, client) : null;
    },
  };
}
