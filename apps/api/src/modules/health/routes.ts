import type { FastifyPluginAsync } from 'fastify';
import type { Pool } from 'mysql2/promise';
import { ERROR_CODES, type DbHealthResponse, type HealthResponse } from '@ekana/shared';
import { pingDatabase } from '../../db/connection.js';
import { AppError } from '../../lib/errors.js';

export function healthRoutes(deps: { pool: Pool }): FastifyPluginAsync {
  return async (app) => {
    app.get('/health', async (): Promise<HealthResponse> => ({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }));

    app.get('/health/db', async (request): Promise<DbHealthResponse> => {
      try {
        const latencyMs = await pingDatabase(deps.pool);
        return { status: 'ok', latencyMs };
      } catch (error) {
        request.log.warn({ err: error }, 'Ping a la BD falló');
        throw new AppError(503, ERROR_CODES.DB_UNAVAILABLE, 'Base de datos no disponible');
      }
    });
  };
}
