import type { FastifyRequest, preHandlerAsyncHookHandler } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { unauthenticated } from '../lib/errors.js';
import type { Auth } from './auth.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

export function requireAuth(auth: Auth): preHandlerAsyncHookHandler {
  return async (request) => {
    const result = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (!result) throw unauthenticated();
    const { user } = result;
    request.authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
    };
  };
}

export function currentUser(request: FastifyRequest): AuthUser {
  if (!request.authUser) throw unauthenticated();
  return request.authUser;
}
