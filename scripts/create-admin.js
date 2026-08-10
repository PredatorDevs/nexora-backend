import { loadEnvironment } from '../src/config/environment.js';
import { createPrismaClient } from '../src/database/prisma.js';
import { seedAdmin } from '../prisma/seed/admin.seed.js';

const environment = loadEnvironment();
if (!environment.initialAdmin) {
  throw new Error(
    'Set all INITIAL_ADMIN_* variables before running admin:create.',
  );
}

const prisma = createPrismaClient({ databaseUrl: environment.databaseUrl });
try {
  await prisma.$connect();
  await seedAdmin(prisma, environment.initialAdmin);
  process.stdout.write('Initial administrator is ready.\n');
} finally {
  await prisma.$disconnect();
}
