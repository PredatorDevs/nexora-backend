import { loadAddressDictionaries } from './address-dictionaries.data.js';
import { mapWithConcurrency } from './seed.utils.js';

export async function seedAddressDictionaries(prisma) {
  const dictionaries = await loadAddressDictionaries();

  // A single interactive transaction is deliberately avoided here. Remote and
  // serverless databases can take longer than Prisma's transaction timeout for
  // 500+ catalog upserts. Every operation is idempotent, so an interrupted seed
  // can safely be run again and continue from the already persisted rows.
  await mapWithConcurrency(dictionaries.countries, (country) =>
    prisma.country.upsert({
      where: { abbreviation: country.abbreviation },
      create: country,
      update: country,
    }),
  );

  const storedDepartments = await mapWithConcurrency(
    dictionaries.departments,
    (department) => {
      const data = {
        name: department.name,
        abbreviation: department.abbreviation,
        mhCode: department.mhCode,
        zone: department.zone,
        isActive: department.isActive,
      };
      return prisma.department.upsert({
        where: { mhCode: department.mhCode },
        create: data,
        update: data,
      });
    },
  );
  const departmentByMhCode = new Map(
    storedDepartments.map((department) => [department.mhCode, department]),
  );

  const storedMunicipalities = await mapWithConcurrency(
    dictionaries.municipalities,
    (municipality) => {
      const department = departmentByMhCode.get(municipality.departmentMhCode);
      const data = {
        departmentId: department.id,
        name: municipality.name,
        mhCode: municipality.mhCode,
        isActive: municipality.isActive,
      };
      return prisma.municipality.upsert({
        where: {
          departmentId_mhCode: {
            departmentId: department.id,
            mhCode: municipality.mhCode,
          },
        },
        create: data,
        update: data,
      });
    },
  );
  // The source and result arrays retain the same order, allowing the stable
  // source codes to be paired with their generated database IDs.
  const municipalityByCode = new Map();
  storedMunicipalities.forEach((municipality, index) => {
    const source = dictionaries.municipalities[index];
    municipalityByCode.set(
      `${source.departmentMhCode}:${source.mhCode}`,
      municipality,
    );
  });

  await mapWithConcurrency(dictionaries.districts, (district) => {
    const municipality = municipalityByCode.get(
      `${district.departmentMhCode}:${district.municipalityMhCode}`,
    );
    const data = {
      municipalityId: municipality.id,
      name: district.name,
      mhCode: district.mhCode,
      isActive: district.isActive,
    };
    return prisma.district.upsert({
      where: {
        municipalityId_mhCode: {
          municipalityId: municipality.id,
          mhCode: district.mhCode,
        },
      },
      create: data,
      update: data,
    });
  });

  return Object.fromEntries(
    Object.entries(dictionaries).map(([name, rows]) => [name, rows.length]),
  );
}
