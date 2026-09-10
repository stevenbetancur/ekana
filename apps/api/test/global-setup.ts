import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db/connection.js';
import { assertTestDatabaseName, ensureDatabase } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrations.js';

export default async function setup(): Promise<void> {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  await ensureDatabase(config.db);
  const pool = createPool(config.db, { connectionLimit: 1 });
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
