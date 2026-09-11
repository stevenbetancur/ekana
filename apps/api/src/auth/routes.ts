import type { FastifyPluginAsync } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import type { Config } from '../config.js';
import type { Auth } from './auth.js';

export function authRoutes(deps: { auth: Auth; config: Config }): FastifyPluginAsync {
  return async (app) => {
    // Better Auth parsea su propio cuerpo: lo reenviamos tal cual llegó (también vacío, como en sign-out).
    app.removeAllContentTypeParsers();
    app.addContentTypeParser('*', { parseAs: 'string' }, (_request, body, done) => done(null, body));

    app.route({
      method: ['GET', 'POST'],
      url: '/auth/*',
      config: { rateLimit: { max: deps.config.auth.rateLimitMax, timeWindow: '1 minute' } },
      async handler(request, reply) {
        const headers = fromNodeHeaders(request.headers);
        headers.delete('content-length');
        const body = typeof request.body === 'string' && request.body.length > 0 ? request.body : undefined;
        const response = await deps.auth.handler(
          new Request(new URL(request.url, deps.config.appUrl), { method: request.method, headers, body }),
        );

        reply.status(response.status);
        response.headers.forEach((value, key) => {
          if (key !== 'set-cookie' && key !== 'content-length') reply.header(key, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) reply.header('set-cookie', cookies);
        return reply.send(response.body ? await response.text() : null);
      },
    });
  };
}
