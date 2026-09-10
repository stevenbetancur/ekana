import type { FastifyPluginAsync } from 'fastify';
import type { HealthResponse } from '@ekana/shared';

export function healthRoutes(): FastifyPluginAsync {
  return async (app) => {
    app.get('/health', async (): Promise<HealthResponse> => ({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }));
  };
}
