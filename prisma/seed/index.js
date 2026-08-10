import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { seedPermissions } from './permissions.seed.js';
import { seedRoles } from './roles.seed.js';
import { seedAdmin } from './admin.seed.js';
import { seedAddressDictionaries } from './address-dictionaries.seed.js';
import { seedEconomicActivities } from './economic-activities.seed.js';
import { seedCompanyRoles } from './company-roles.seed.js';

const environment = loadEnvironment();
const prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });

try {
  await prisma.$connect();
  await seedPermissions(prisma);
  await seedRoles(prisma);
  const addressDictionaryCounts = await seedAddressDictionaries(prisma);
  const economicActivities = await seedEconomicActivities(prisma);
  const companiesWithRoles = await seedCompanyRoles(prisma);
  await seedAdmin(prisma, environment.initialAdmin);
  process.stdout.write(
    `Seed completed successfully: ${JSON.stringify({ ...addressDictionaryCounts, economicActivities, companiesWithRoles })}.\n`,
  );
} finally {
  await prisma.$disconnect();
}
