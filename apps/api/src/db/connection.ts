import mysql, { type ConnectionOptions, type Pool, type PoolOptions } from 'mysql2/promise';
import awsCaBundle from 'aws-ssl-profiles';
import type { DbConfig } from '../config.js';

// RDS no activa el modo estricto por defecto: sin él MySQL trunca datos en silencio.
const STRICT_SQL_MODE =
  'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

export function connectionOptions(db: DbConfig): ConnectionOptions {
  return {
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    ssl: db.ssl ? awsCaBundle : undefined,
    timezone: 'Z',
  };
}

export function createPool(db: DbConfig, extra: PoolOptions = {}): Pool {
  const pool = mysql.createPool({
    ...connectionOptions(db),
    database: db.database,
    connectionLimit: db.poolSize,
    waitForConnections: true,
    enableKeepAlive: true,
    ...extra,
  });
  pool.pool.on('connection', (connection) => {
    connection.query(`SET SESSION sql_mode = '${STRICT_SQL_MODE}'`, (error) => {
      if (error) console.error('No se pudo fijar sql_mode estricto', error);
    });
  });
  return pool;
}

export async function pingDatabase(pool: Pool): Promise<number> {
  const started = performance.now();
  await pool.query('SELECT 1');
  return Math.round(performance.now() - started);
}
