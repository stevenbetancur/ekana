import { expect } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { createPool } from '../../src/db/connection.js';
import { createDb } from '../../src/db/client.js';
import { loadTestConfig } from './config.js';

export const ER_DUP_ENTRY = 1062;
export const ER_DATA_TRUNCATED = 1265;

const config = loadTestConfig();
export const testPool = createPool(config.db, { multipleStatements: true, connectionLimit: 2 });
export const testDb = createDb(testPool);

export async function resetDb(): Promise<void> {
  const [rows] = await testPool.query<RowDataPacket[]>(
    `SELECT table_name AS name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' AND table_name <> '__drizzle_migrations'`,
  );
  if (rows.length === 0) return;
  const truncates = rows.map((row) => `TRUNCATE TABLE \`${String(row.name)}\`;`).join(' ');
  await testPool.query(`SET FOREIGN_KEY_CHECKS = 0; ${truncates} SET FOREIGN_KEY_CHECKS = 1;`);
}

export async function closeTestDb(): Promise<void> {
  await testPool.end();
}

// Drizzle envuelve los errores del driver en `cause`; el pool crudo los lanza directo.
export async function expectDbError(promise: Promise<unknown>, errno: number): Promise<void> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error, 'se esperaba un error de MySQL').not.toBeNull();
  const e = error as { errno?: number; cause?: { errno?: number } };
  expect(e.cause?.errno ?? e.errno).toBe(errno);
}
