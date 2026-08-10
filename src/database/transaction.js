import { getPrisma } from './prisma.js';

export function runInTransaction(operation, options, client = getPrisma()) {
  return client.$transaction(operation, options);
}
