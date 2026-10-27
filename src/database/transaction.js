import { getPrisma } from './prisma.js';

const defaultTransactionOptions = Object.freeze({
  maxWait: 5_000,
  timeout: 30_000,
});

export function runInTransaction(operation, options, client = getPrisma()) {
  return client.$transaction(operation, {
    ...defaultTransactionOptions,
    ...options,
  });
}
