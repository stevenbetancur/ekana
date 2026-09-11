import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { createPool } from '../src/db/connection.js';
import { makeTestConfig } from './helpers/config.js';

const INDEX_HTML = '<!doctype html><html><head><title>Ekana</title></head><body><div id="root"></div></body></html>';
const config = makeTestConfig();
const lazyPool = createPool(config.db);
let distDir: string;
let app: FastifyInstance;

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), 'ekana-web-'));
  mkdirSync(join(distDir, 'assets'));
  writeFileSync(join(distDir, 'index.html'), INDEX_HTML);
  writeFileSync(join(distDir, 'assets', 'app-abc123.js'), 'console.log("ekana")');
  writeFileSync(join(distDir, 'favicon.ico'), 'ico');
  app = buildApp({ config, pool: lazyPool, webDistDir: distDir });
});

afterAll(async () => {
  await app.close();
  await lazyPool.end();
  rmSync(distDir, { recursive: true, force: true });
});

describe('servir el front desde el API', () => {
  it('sirve index.html en / sin caché y con CSP', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('<div id="root">');
    expect(res.headers['cache-control']).toBe('no-cache');
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
  });

  it('las rutas de la SPA reciben index.html', async () => {
    for (const url of ['/dashboard', '/team/abc/roadmap', '/auth/reset-password?token=x']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode, url).toBe(200);
      expect(res.body, url).toContain('<div id="root">');
    }
  });

  it('sirve los assets con caché inmutable', async () => {
    const res = await app.inject({ method: 'GET', url: '/assets/app-abc123.js' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('ekana');
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('los archivos inexistentes y el API desconocido siguen respondiendo 404 JSON', async () => {
    for (const url of ['/api/no-existe', '/assets/no-existe.js', '/logo.png']) {
      const res = await app.inject({ method: 'GET', url });
      expect(res.statusCode, url).toBe(404);
      expect(res.json().error.code, url).toBe('ROUTE_NOT_FOUND');
    }
  });

  it('solo las navegaciones GET reciben la SPA', async () => {
    const res = await app.inject({ method: 'POST', url: '/dashboard' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('el API sigue funcionando junto al front', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ok');
  });
});

describe('API sin build del front', () => {
  it('no sirve la SPA si no hay index.html', async () => {
    const apiOnly = buildApp({ config, pool: lazyPool, webDistDir: join(distDir, 'no-existe') });
    const res = await apiOnly.inject({ method: 'GET', url: '/dashboard' });
    await apiOnly.close();
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('ROUTE_NOT_FOUND');
  });
});
