import 'dotenv/config';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db/connection.js';

const config = loadConfig();
const pool = createPool(config.db);
const app = buildApp({ config, pool });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Cerrando servidor');
  try {
    await app.close();
    await pool.end();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'Error al cerrar');
    process.exit(1);
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: config.host, port: config.port });
