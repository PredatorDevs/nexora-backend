import { afterEach, describe, expect, it } from 'vitest';

import {
  createPrismaClient,
  disconnectPrisma,
  getPrisma,
  initializePrisma,
} from '../../../src/database/prisma.js';

const databaseUrl = 'mysql://app:secret@localhost:3306/app_test';

describe('Prisma client lifecycle', () => {
  afterEach(async () => {
    await disconnectPrisma();
  });

  it('creates a Prisma client using the MySQL adapter', async () => {
    const client = createPrismaClient({ databaseUrl, log: [] });

    expect(client.$connect).toBeTypeOf('function');
    expect(client.user).toBeDefined();
    await client.$disconnect();
  });

  it('initializes a single shared client and exposes it explicitly', () => {
    const first = initializePrisma({ databaseUrl, log: [] });
    const second = initializePrisma({ databaseUrl, log: [] });

    expect(second).toBe(first);
    expect(getPrisma()).toBe(first);
  });
});
