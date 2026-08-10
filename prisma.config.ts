import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? env('TEST_DATABASE_URL')
    : env('DATABASE_URL');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --env-file-if-exists=.env prisma/seed/index.js',
  },
  datasource: {
    url: databaseUrl,
  },
});
