import { loadConfig, type Config } from '../../src/config.js';

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
