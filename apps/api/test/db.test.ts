import { describe, it, expect, afterAll } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { dbHealthResponseSchema } from '@ekana/shared';
import { createPool, pingDatabase } from '../src/db/connection.js';
import { assertTestDatabaseName } from '../src/db/database.js';
import { buildApp } from '../src/app.js';
import { loadTestConfig } from './helpers/config.js';

const config = loadTestConfig();
const pool = createPool(config.db);

afterAll(async () => {
  await pool.end();
});

describe('conexión MySQL', () => {
  it('hace ping a la BD de tests', async () => {
    const latency = await pingDatabase(pool);
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('usa modo estricto en la sesión', async () => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT @@SESSION.sql_mode AS mode');
    expect(rows[0]?.mode).toContain('STRICT_TRANS_TABLES');
  });

  it('la BD de tests usa utf8mb4_0900_ai_ci', async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT default_collation_name AS c FROM information_schema.schemata WHERE schema_name = DATABASE()',
    );
    expect(rows[0]?.c).toBe('utf8mb4_0900_ai_ci');
  });
});

describe('guardia de BD de tests', () => {
  it('rechaza nombres que no terminan en _test', () => {
    expect(() => assertTestDatabaseName('ekana')).toThrow(/_test/);
    expect(() => assertTestDatabaseName('ekana_test')).not.toThrow();
  });
});

describe('GET /api/health/db', () => {
  it('responde ok con la latencia cuando la BD responde', async () => {
    const app = buildApp({ config, pool });
    const res = await app.inject({ method: 'GET', url: '/api/health/db' });
    await app.close();
    expect(res.statusCode).toBe(200);
    expect(dbHealthResponseSchema.parse(res.json()).status).toBe('ok');
  });

  it('responde 503 DB_UNAVAILABLE cuando la BD no responde', async () => {
    const deadPool = createPool({ ...config.db, host: '127.0.0.1', port: 1, ssl: false }, { connectTimeout: 2000 });
    const app = buildApp({ config, pool: deadPool });
    const res = await app.inject({ method: 'GET', url: '/api/health/db' });
    await app.close();
    await deadPool.end();
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('DB_UNAVAILABLE');
  });
});
