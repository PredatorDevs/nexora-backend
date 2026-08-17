const supplierSelect = {
  id: true, companyId: true, code: true, name: true, nit: true, nrc: true,
  countryId: true, departmentId: true, municipalityId: true, districtId: true,
  foreignAdministrativeArea: true, foreignLocality: true, addressLine: true,
  phone: true, email: true, website: true, isActive: true,
  createdAt: true, updatedAt: true,
  country: { select: { id: true, name: true, abbreviation: true } },
  department: { select: { id: true, name: true } },
  municipality: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
};
const contactSelect = {
  id: true, companyId: true, supplierId: true, fullName: true,
  jobTitle: true, department: true, phone: true, email: true,
  isPrimary: true, validFrom: true, validUntil: true, notes: true,
  isActive: true, createdAt: true, updatedAt: true,
};

export function createSuppliersRepository(prisma) {
  return {
    async list(companyId, { page, pageSize, search, countryId, isActive, sortBy, sortOrder }) {
      const where = {
        companyId,
        ...(countryId ? { countryId } : {}),
        ...(isActive === undefined ? {} : { isActive }),
        ...(search ? { OR: [
          { code: { contains: search } }, { name: { contains: search } },
          { nit: { contains: search } }, { nrc: { contains: search } },
          { email: { contains: search } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supplier.findMany({ where, select: supplierSelect, skip: (page - 1) * pageSize, take: pageSize, orderBy: { [sortBy]: sortOrder } }),
        prisma.supplier.count({ where }),
      ]);
      return { items, total };
    },
    findSupplier(companyId, supplierId, client = prisma) {
      return client.supplier.findFirst({ where: { id: supplierId, companyId }, select: supplierSelect });
    },
    async findAddressContext(companyId, { countryId, departmentId, municipalityId, districtId }, client = prisma) {
      const [company, country, district] = await Promise.all([
        client.company.findUnique({ where: { id: companyId }, select: { id: true, status: true } }),
        client.country.findFirst({ where: { id: countryId, isActive: true }, select: { id: true, abbreviation: true } }),
        departmentId && municipalityId && districtId
          ? client.district.findFirst({
              where: {
                id: districtId, municipalityId, isActive: true,
                municipality: { departmentId, isActive: true, department: { isActive: true } },
              },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);
      return { company, country, district };
    },
    createSupplier(companyId, data, client = prisma) {
      return client.supplier.create({ data: { companyId, ...data }, select: supplierSelect });
    },
    async updateSupplier(companyId, supplierId, expectedUpdatedAt, data, client = prisma) {
      const result = await client.supplier.updateMany({
        where: { id: supplierId, companyId, updatedAt: expectedUpdatedAt }, data,
      });
      return result.count === 1 ? this.findSupplier(companyId, supplierId, client) : null;
    },
    async listContacts(companyId, supplierId, { page, pageSize, search, isActive, sortBy, sortOrder }) {
      const where = {
        companyId, supplierId,
        ...(isActive === undefined ? {} : { isActive }),
        ...(search ? { OR: [
          { fullName: { contains: search } }, { jobTitle: { contains: search } },
          { department: { contains: search } }, { email: { contains: search } },
        ] } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.supplierContact.findMany({ where, select: contactSelect, skip: (page - 1) * pageSize, take: pageSize, orderBy: [{ isPrimary: 'desc' }, { [sortBy]: sortOrder }] }),
        prisma.supplierContact.count({ where }),
      ]);
      return { items, total };
    },
    findContact(companyId, supplierId, contactId, client = prisma) {
      return client.supplierContact.findFirst({
        where: { id: contactId, companyId, supplierId }, select: contactSelect,
      });
    },
    findPrimaryContact(companyId, supplierId, client = prisma) {
      return client.supplierContact.findFirst({
        where: { companyId, supplierId, isPrimary: true, isActive: true }, select: contactSelect,
      });
    },
    createContact(companyId, supplierId, data, client = prisma) {
      return client.supplierContact.create({
        data: { companyId, supplierId, ...data }, select: contactSelect,
      });
    },
    async updateContact(companyId, supplierId, contactId, expectedUpdatedAt, data, client = prisma) {
      const result = await client.supplierContact.updateMany({
        where: { id: contactId, companyId, supplierId, updatedAt: expectedUpdatedAt }, data,
      });
      return result.count === 1 ? this.findContact(companyId, supplierId, contactId, client) : null;
    },
  };
}
