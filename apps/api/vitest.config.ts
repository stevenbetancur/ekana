import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Los tests nunca tocan la BD de desarrollo: forzamos la BD *_test.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_TEST_NAME ?? 'ekana_test';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
