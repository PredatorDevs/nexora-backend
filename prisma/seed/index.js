import { loadEnvironment } from '../../src/config/environment.js';
import { createPrismaClient } from '../../src/database/prisma.js';
import { seedPermissions } from './permissions.seed.js';
import { seedRoles } from './roles.seed.js';
import { seedAdmin } from './admin.seed.js';

const environment = loadEnvironment();
const prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });

try {
  await prisma.$connect();
  await seedPermissions(prisma);
  await seedRoles(prisma);
  await seedAdmin(prisma, environment.initialAdmin);
  process.stdout.write('RBAC seed completed successfully.\n');
} finally {
  await prisma.$disconnect();
}
