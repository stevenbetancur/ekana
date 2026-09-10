import { describe, it, expect } from 'vitest';
import { loadConfig, ConfigError } from '../src/config.js';

const base = { DB_HOST: 'db.local', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'ekana' };

describe('loadConfig', () => {
  it('aplica valores por defecto', () => {
    const config = loadConfig(base);
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.host).toBe('::');
    expect(config.corsOrigins).toEqual(['http://localhost:8080']);
    expect(config.rateLimitMax).toBe(300);
    expect(config.db).toEqual({
      host: 'db.local',
      port: 3306,
      user: 'u',
      password: 'p',
      database: 'ekana',
      ssl: true,
      poolSize: 10,
    });
  });

  it('convierte tipos desde strings', () => {
    const config = loadConfig({
      ...base,
      PORT: '8081',
      DB_SSL: 'false',
      CORS_ORIGINS: 'https://a.com, https://b.com',
    });
    expect(config.port).toBe(8081);
    expect(config.db.ssl).toBe(false);
    expect(config.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });

  it('falla indicando las variables que faltan', () => {
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(ConfigError);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_HOST/);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_PASSWORD/);
  });

  it('rechaza un puerto inválido', () => {
    expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/);
  });
});
