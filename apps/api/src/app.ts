import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import type { Pool } from 'mysql2/promise';
import { ERROR_CODES } from '@ekana/shared';
import { createAuth } from './auth/auth.js';
import { authRoutes } from './auth/routes.js';
import type { Config } from './config.js';
import { createDb } from './db/client.js';
import { createMailer, type Mailer } from './email/mailer.js';
import { registerErrorHandling } from './lib/error-handler.js';
import { AppError } from './lib/errors.js';
import { redactUrl } from './lib/redact.js';
import { healthRoutes } from './modules/health/routes.js';
import { profileRoutes } from './modules/profiles/routes.js';

export interface AppDeps {
  config: Config;
  pool: Pool;
  mailer?: Mailer;
}

export function buildApp({ config, pool, mailer }: AppDeps): FastifyInstance {
  const app = Fastify({
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: config.logLevel,
            redact: ['req.headers.cookie', 'req.headers.authorization'],
            serializers: {
              req: (request: FastifyRequest) => ({
                method: request.method,
                url: redactUrl(request.url),
                host: request.host,
                remoteAddress: request.ip,
              }),
            },
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

  const db = createDb(pool);
  const auth = createAuth({ db, config, mailer: mailer ?? createMailer(config), log: app.log });
  app.register(authRoutes({ auth, config }), { prefix: '/api' });
  app.register(profileRoutes({ db, auth }), { prefix: '/api/v1' });
  app.register(healthRoutes({ pool }), { prefix: '/api' });

  return app;
}
