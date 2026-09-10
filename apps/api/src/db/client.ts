import { drizzle } from 'drizzle-orm/mysql2';
import type { Pool } from 'mysql2/promise';
import * as schema from './schema/index.js';

export function createDb(pool: Pool) {
  return drizzle({ client: pool, schema, mode: 'default', casing: 'snake_case' });
}

export type Db = ReturnType<typeof createDb>;
