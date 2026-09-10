import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { registerErrorHandling } from './lib/error-handler.js';
import { healthRoutes } from './modules/health/routes.js';

export interface AppDeps {
  config: Config;
}

export function buildApp({ config }: AppDeps): FastifyInstance {
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
  app.register(healthRoutes(), { prefix: '/api' });

  return app;
}
