import { loadConfig } from '../src/config.js';
import { assertTestDatabaseName, ensureDatabase } from '../src/db/database.js';

export default async function setup(): Promise<void> {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  await ensureDatabase(config.db);
}
