import { loadConfig, type Config } from '../../src/config.js';
import { assertTestDatabaseName } from '../../src/db/database.js';

// Config sintética para tests que no tocan la BD (el pool de mysql2 no conecta hasta la primera query).
export function makeTestConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    DB_HOST: '127.0.0.1',
    DB_USER: 'test',
    DB_PASSWORD: 'test',
    DB_NAME: 'unit_test',
    DB_SSL: 'false',
    ...overrides,
  });
}

// Config real (apps/api/.env + DB_NAME forzado a *_test por vitest.config.ts).
export function loadTestConfig(): Config {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  return config;
}
