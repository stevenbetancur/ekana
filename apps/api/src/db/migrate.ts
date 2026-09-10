import 'dotenv/config';
import { loadConfig } from '../config.js';
import { createPool } from './connection.js';
import { runMigrations } from './migrations.js';

const config = loadConfig();
const pool = createPool(config.db, { connectionLimit: 1 });
try {
  await runMigrations(pool);
  console.log(`Migraciones aplicadas en "${config.db.database}"`);
} finally {
  await pool.end();
}
