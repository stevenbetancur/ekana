import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Los tests nunca tocan la BD de desarrollo: forzamos la BD *_test.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_TEST_NAME ?? 'ekana_test';
// Auth determinista y sin correos reales en los tests.
process.env.APP_URL = 'http://localhost:8080';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-que-solo-se-usa-en-tests-0123456789';
process.env.SMTP_HOST = '';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
