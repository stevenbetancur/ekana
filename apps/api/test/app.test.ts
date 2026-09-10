import { describe, it, expect, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { healthResponseSchema, errorResponseSchema } from '@ekana/shared';
import { buildApp } from '../src/app.js';
import { createPool } from '../src/db/connection.js';
import { AppError } from '../src/lib/errors.js';
import { makeTestConfig } from './helpers/config.js';

const config = makeTestConfig();
const lazyPool = createPool(config.db);
let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

afterAll(async () => {
  await lazyPool.end();
});

function createApp(): FastifyInstance {
  app = buildApp({ config, pool: lazyPool });
  return app;
}

describe('app', () => {
  it('GET /api/health responde ok', async () => {
    const res = await createApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = healthResponseSchema.parse(res.json());
    expect(body.status).toBe('ok');
  });

  it('una ruta inexistente responde 404 ROUTE_NOT_FOUND', async () => {
    const res = await createApp().inject({ method: 'GET', url: '/api/no-existe' });
    expect(res.statusCode).toBe(404);
    expect(errorResponseSchema.parse(res.json()).error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('un AppError responde con su status, código y mensaje', async () => {
    const instance = createApp();
    instance.get('/api/__conflict', async () => {
      throw new AppError(409, 'CONFLICT', 'Ya existe');
    });
    const res = await instance.inject({ method: 'GET', url: '/api/__conflict' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: { code: 'CONFLICT', message: 'Ya existe' } });
  });

  it('un ZodError responde 400 VALIDATION_ERROR con detalles', async () => {
    const instance = createApp();
    instance.post('/api/__validate', async (request) => z.object({ name: z.string() }).parse(request.body));
    const res = await instance.inject({ method: 'POST', url: '/api/__validate', payload: {} });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details[0].path).toBe('name');
  });

  it('un JSON mal formado responde 400 BAD_REQUEST', async () => {
    const instance = createApp();
    instance.post('/api/__echo', async (request) => request.body);
    const res = await instance.inject({
      method: 'POST',
      url: '/api/__echo',
      headers: { 'content-type': 'application/json' },
      payload: '{mal',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });

  it('un error inesperado responde 500 sin filtrar el mensaje interno', async () => {
    const instance = createApp();
    instance.get('/api/__boom', async () => {
      throw new Error('detalle secreto');
    });
    const res = await instance.inject({ method: 'GET', url: '/api/__boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
    expect(res.body).not.toContain('secreto');
  });
});
