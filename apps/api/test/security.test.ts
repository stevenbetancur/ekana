import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { createPool } from '../src/db/connection.js';
import { makeTestConfig } from './helpers/config.js';

const config = makeTestConfig({ CORS_ORIGINS: 'https://app.ekana.test', RATE_LIMIT_MAX: '3' });
const lazyPool = createPool(config.db);

afterAll(async () => {
  await lazyPool.end();
});

describe('seguridad HTTP', () => {
  it('añade cabeceras de seguridad (helmet)', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    await app.close();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('permite CORS con credenciales solo a orígenes de la lista', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const allowed = await app.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://app.ekana.test' } });
    const denied = await app.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://malicioso.test' } });
    await app.close();
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.ekana.test');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('limita la tasa de peticiones y responde 429 RATE_LIMITED', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const statuses: number[] = [];
    let last;
    for (let i = 0; i < 4; i++) {
      last = await app.inject({ method: 'GET', url: '/api/health' });
      statuses.push(last.statusCode);
    }
    await app.close();
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(last!.json().error.code).toBe('RATE_LIMITED');
  });
});
