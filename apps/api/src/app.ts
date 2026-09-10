import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'mysql2/promise';
import type { Config } from './config.js';
import { registerErrorHandling } from './lib/error-handler.js';
import { healthRoutes } from './modules/health/routes.js';

export interface AppDeps {
  config: Config;
  pool: Pool;
}

export function buildApp({ config, pool }: AppDeps): FastifyInstance {
  const app = Fastify({
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: config.logLevel,
            redact: ['req.headers.cookie', 'req.headers.authorization'],
            transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
          },
    genReqId: () => randomUUID(),
    trustProxy: true,
  });

  registerErrorHandling(app);
  app.register(healthRoutes({ pool }), { prefix: '/api' });

  return app;
}
