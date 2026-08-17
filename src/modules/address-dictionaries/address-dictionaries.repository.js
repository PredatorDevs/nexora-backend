const countrySelect = {
  id: true,
  name: true,
  abbreviation: true,
  mhCode: true,
  isActive: true,
};

const departmentSelect = {
  id: true,
  name: true,
  abbreviation: true,
  mhCode: true,
  zone: true,
  isActive: true,
};

const municipalitySelect = {
  id: true,
  departmentId: true,
  name: true,
  mhCode: true,
  isActive: true,
};

const districtSelect = {
  id: true,
  municipalityId: true,
  name: true,
  mhCode: true,
  isActive: true,
};

async function list(model, query, where, select) {
  const { page, pageSize, sortBy, sortOrder } = query;
  const [items, total] = await Promise.all([
    model.findMany({
      where,
      select,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    model.count({ where }),
  ]);
  return { items, total };
}

function commonWhere({ search, activeOnly }) {
  return {
    ...(activeOnly ? { isActive: true } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };
}

export function createAddressDictionariesRepository(prisma) {
  return {
    listCountries(query) {
      const where = {
        ...(query.activeOnly ? { isActive: true } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search } },
                { abbreviation: { contains: query.search } },
                { mhCode: { contains: query.search } },
              ],
            }
          : {}),
      };
      return list(prisma.country, query, where, countrySelect);
    },

    listDepartments(query) {
      const where = {
        ...commonWhere(query),
        ...(query.zone ? { zone: query.zone } : {}),
      };
      return list(prisma.department, query, where, departmentSelect);
    },

    listMunicipalities(query) {
      const where = {
        ...commonWhere(query),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      };
      return list(prisma.municipality, query, where, municipalitySelect);
    },

    listDistricts(query) {
      const where = {
        ...commonWhere(query),
        ...(query.municipalityId
          ? { municipalityId: query.municipalityId }
          : {}),
        ...(query.departmentId
          ? { municipality: { departmentId: query.departmentId } }
          : {}),
      };
      return list(prisma.district, query, where, districtSelect);
    },
  };
}
