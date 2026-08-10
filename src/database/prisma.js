import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

let prismaClient;

export function createPrismaClient({ databaseUrl, log = [] }) {
  const adapter = new PrismaMariaDb(databaseUrl);

  return new PrismaClient({ adapter, log });
}

export function initializePrisma(options) {
  if (!prismaClient) {
    prismaClient = createPrismaClient(options);
  }

  return prismaClient;
}

export function getPrisma() {
  if (!prismaClient) {
    throw new Error('Prisma has not been initialized.');
  }

  return prismaClient;
}

export async function disconnectPrisma() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = undefined;
  }
}
