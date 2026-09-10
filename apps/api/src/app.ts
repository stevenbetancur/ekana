import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'mysql2/promise';
import { ERROR_CODES } from '@ekana/shared';
import type { Config } from './config.js';
import { registerErrorHandling } from './lib/error-handler.js';
import { AppError } from './lib/errors.js';
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
  app.register(helmet);
  app.register(cors, { origin: config.corsOrigins, credentials: true });
  app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) =>
      new AppError(429, ERROR_CODES.RATE_LIMITED, `Demasiadas solicitudes, reintenta en ${context.after}`),
  });
  app.register(healthRoutes({ pool }), { prefix: '/api' });

  return app;
}
