import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

// Los archivos de assets/ llevan hash en el nombre: se pueden cachear para siempre.
const HASHED_ASSET = /[\\/]assets[\\/]/;
const IMMUTABLE = 'public, max-age=31536000, immutable';
const NO_CACHE = 'no-cache';

/** Devuelve el index.html del build del front, o null si el API corre sin front. */
export function loadSpaIndex(distDir: string | null | undefined): string | null {
  if (!distDir) return null;
  const indexPath = join(distDir, 'index.html');
  return existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : null;
}

export function registerWebApp(app: FastifyInstance, distDir: string): void {
  app.register(fastifyStatic, {
    root: distDir,
    prefix: '/',
    // Solo se registran los archivos que existen en el build; el resto cae en el fallback de la SPA.
    wildcard: false,
    cacheControl: false,
    // En @fastify/static 10, `setHeaders` recibe el FastifyReply (no el ServerResponse crudo).
    setHeaders: (reply, filePath) => {
      reply.header('cache-control', HASHED_ASSET.test(filePath) ? IMMUTABLE : NO_CACHE);
    },
  });
}
