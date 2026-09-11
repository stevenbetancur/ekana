import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { EmailMessage } from '../../src/email/mailer.js';
import { emailLink } from './mailer.js';

type InjectResponse = Awaited<ReturnType<FastifyInstance['inject']>>;

export const APP_ORIGIN = 'http://localhost:8080';
export const DEFAULT_PASSWORD = 'Password123!';

export function cookieHeader(res: InjectResponse): string {
  return res.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}

export function hasSessionCookie(res: InjectResponse): boolean {
  return res.cookies.some((cookie) => cookie.name.includes('session_token') && cookie.value !== '');
}

export function signUp(app: FastifyInstance, input: { email: string; password?: string; name?: string }) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    headers: { origin: APP_ORIGIN },
    payload: {
      email: input.email,
      password: input.password ?? DEFAULT_PASSWORD,
      name: input.name ?? 'Ana Test',
      callbackURL: '/onboarding',
    },
  });
}

export function signIn(app: FastifyInstance, email: string, password = DEFAULT_PASSWORD) {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    headers: { origin: APP_ORIGIN },
    payload: { email, password },
  });
}

export function latestEmailTo(sent: EmailMessage[], to: string): EmailMessage {
  const message = [...sent].reverse().find((item) => item.to === to);
  if (!message) throw new Error(`No se envió ningún correo a ${to}`);
  return message;
}

export async function verifyLatestEmail(app: FastifyInstance, sent: EmailMessage[], email: string) {
  const link = emailLink(latestEmailTo(sent, email));
  return app.inject({ method: 'GET', url: `${link.pathname}${link.search}`, headers: { origin: APP_ORIGIN } });
}

export async function createVerifiedUser(
  app: FastifyInstance,
  sent: EmailMessage[],
  input: { email?: string; name?: string } = {},
) {
  const email = input.email ?? `user-${randomUUID()}@test.local`;
  await signUp(app, { email, name: input.name });
  const verified = await verifyLatestEmail(app, sent, email);
  return { email, password: DEFAULT_PASSWORD, cookie: cookieHeader(verified) };
}
