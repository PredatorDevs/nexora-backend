import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    pool: 'forks',
    maxWorkers: 1,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
    },
  },
});
