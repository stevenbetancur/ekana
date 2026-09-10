import mysql from 'mysql2/promise';
import type { DbConfig } from '../config.js';
import { connectionOptions } from './connection.js';

const SAFE_DATABASE_NAME = /^[A-Za-z0-9_]+$/;

export function assertTestDatabaseName(name: string): void {
  if (!name.endsWith('_test')) {
    throw new Error(`Por seguridad los tests solo corren contra una BD *_test (recibido: "${name}")`);
  }
}

export async function ensureDatabase(db: DbConfig): Promise<void> {
  if (!SAFE_DATABASE_NAME.test(db.database)) {
    throw new Error(`Nombre de BD inválido: "${db.database}"`);
  }
  const connection = await mysql.createConnection(connectionOptions(db));
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await connection.query(`ALTER DATABASE \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  } finally {
    await connection.end();
  }
}
