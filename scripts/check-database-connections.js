import { loadEnvironment } from '../src/config/environment.js';
import { createPrismaClient } from '../src/database/prisma.js';

async function checkConnection(nodeEnv, label) {
  const environment = loadEnvironment({ ...process.env, NODE_ENV: nodeEnv });
  const client = createPrismaClient({ databaseUrl: environment.databaseUrl });

  try {
    await client.$connect();
    process.stdout.write(`${label} database connection succeeded.\n`);
  } finally {
    await client.$disconnect();
  }
}

const applicationEnvironment = loadEnvironment({
  ...process.env,
  NODE_ENV: 'development',
});
const testEnvironment = loadEnvironment({ ...process.env, NODE_ENV: 'test' });

function databaseIdentity(databaseUrl) {
  const url = new URL(databaseUrl);
  return `${url.hostname}:${url.port || '3306'}${url.pathname}`;
}

if (
  databaseIdentity(applicationEnvironment.databaseUrl) ===
  databaseIdentity(testEnvironment.databaseUrl)
) {
  throw new Error(
    'Application and test URLs must identify different databases.',
  );
}

await checkConnection('development', 'Application');
await checkConnection('test', 'Test');
