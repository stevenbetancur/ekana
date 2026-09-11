import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ERROR_CODES, type ErrorResponse } from '@ekana/shared';
import { AppError } from './errors.js';

function errorBody(code: string, message: string, details?: unknown): ErrorResponse {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

function statusCodeOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const { statusCode } = error as { statusCode: unknown };
    return typeof statusCode === 'number' ? statusCode : undefined;
  }
  return undefined;
}

// Solo las navegaciones de página (GET/HEAD fuera de /api y sin extensión de archivo) reciben la SPA.
function isPageNavigation(request: FastifyRequest): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const path = request.url.split('?')[0] ?? '';
  if (path === '/api' || path.startsWith('/api/')) return false;
  const lastSegment = path.split('/').pop() ?? '';
  return !lastSegment.includes('.');
}

export function registerErrorHandling(app: FastifyInstance, options: { spaIndexHtml?: string | null } = {}): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(errorBody(error.code, error.message, error.details));
    }
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
      return reply.status(400).send(errorBody(ERROR_CODES.VALIDATION_ERROR, 'Datos inválidos', details));
    }
    const statusCode = statusCodeOf(error);
    if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
      const message = error instanceof Error ? error.message : 'Solicitud inválida';
      return reply.status(statusCode).send(errorBody(ERROR_CODES.BAD_REQUEST, message));
    }
    request.log.error({ err: error }, 'Error no controlado');
    return reply.status(500).send(errorBody(ERROR_CODES.INTERNAL_ERROR, 'Error interno del servidor'));
  });

  app.setNotFoundHandler((request, reply) => {
    if (options.spaIndexHtml && isPageNavigation(request)) {
      return reply.status(200).type('text/html; charset=utf-8').header('cache-control', 'no-cache').send(options.spaIndexHtml);
    }
    return reply
      .status(404)
      .send(errorBody(ERROR_CODES.ROUTE_NOT_FOUND, `Ruta no encontrada: ${request.method} ${request.url}`));
  });
}
