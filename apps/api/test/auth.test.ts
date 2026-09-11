import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { buildApp } from '../src/app.js';
import { profiles, users } from '../src/db/schema/index.js';
import { closeTestDb, resetDb, testDb, testPool } from './helpers/db.js';
import { loadTestConfig } from './helpers/config.js';
import { createFakeMailer, emailLink } from './helpers/mailer.js';
import {
  APP_ORIGIN,
  cookieHeader,
  createVerifiedUser,
  DEFAULT_PASSWORD,
  hasSessionCookie,
  latestEmailTo,
  signIn,
  signUp,
  verifyLatestEmail,
} from './helpers/auth.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const baseConfig = loadTestConfig();
const mailer = createFakeMailer();
let app: FastifyInstance;

beforeAll(() => {
  app = buildApp({ config: { ...baseConfig, auth: { ...baseConfig.auth, rateLimitMax: 1000 } }, pool: testPool, mailer });
});

beforeEach(async () => {
  await resetDb();
  mailer.sent.length = 0;
});

afterAll(async () => {
  await app.close();
  await closeTestDb();
});

function getSession(cookie: string) {
  return app.inject({ method: 'GET', url: '/api/auth/get-session', headers: { cookie, origin: APP_ORIGIN } });
}

describe('registro y verificación', () => {
  it('crea el usuario con UUID y su perfil, envía el correo y no abre sesión', async () => {
    const res = await signUp(app, { email: 'ana@test.local' });
    expect(res.statusCode).toBe(200);
    expect(hasSessionCookie(res)).toBe(false);

    const [user] = await testDb.select().from(users).where(eq(users.email, 'ana@test.local'));
    expect(user?.id).toMatch(UUID);
    expect(user?.emailVerified).toBe(false);
    expect(await testDb.select().from(profiles).where(eq(profiles.id, user!.id))).toHaveLength(1);
    expect(latestEmailTo(mailer.sent, 'ana@test.local').subject).toBe('Verify your Ekana email');
  });

  it('no permite iniciar sesión sin verificar y reenvía la verificación', async () => {
    await signUp(app, { email: 'ana@test.local' });
    const res = await signIn(app, 'ana@test.local');
    expect(res.statusCode).toBe(403);
    expect(res.json().code).toBe('EMAIL_NOT_VERIFIED');
    expect(mailer.sent.filter((m) => m.to === 'ana@test.local')).toHaveLength(2);
  });

  it('el enlace de verificación abre sesión y redirige al callback', async () => {
    await signUp(app, { email: 'ana@test.local' });
    const res = await verifyLatestEmail(app, mailer.sent, 'ana@test.local');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toMatch(/\/onboarding$/);
    expect(hasSessionCookie(res)).toBe(true);

    const session = await getSession(cookieHeader(res));
    expect(session.json().user.emailVerified).toBe(true);
  });

  it('rechaza contraseñas de menos de 8 caracteres', async () => {
    const res = await signUp(app, { email: 'ana@test.local', password: 'corta' });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('PASSWORD_TOO_SHORT');
  });
});

describe('login y logout', () => {
  it('inicia sesión con credenciales válidas y la cierra con sign-out', async () => {
    const { email } = await createVerifiedUser(app, mailer.sent);
    const login = await signIn(app, email);
    expect(login.statusCode).toBe(200);
    expect(hasSessionCookie(login)).toBe(true);
    const cookie = cookieHeader(login);

    const out = await app.inject({ method: 'POST', url: '/api/auth/sign-out', headers: { cookie, origin: APP_ORIGIN } });
    expect(out.statusCode).toBe(200);
    expect((await getSession(cookie)).json()).toBeNull();
  });

  it('responde 401 INVALID_EMAIL_OR_PASSWORD con una contraseña incorrecta', async () => {
    const { email } = await createVerifiedUser(app, mailer.sent);
    const res = await signIn(app, email, 'incorrecta123');
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('INVALID_EMAIL_OR_PASSWORD');
  });
});

describe('recuperación de contraseña', () => {
  it('cambia la contraseña con el enlace del correo y cierra las sesiones abiertas', async () => {
    const { email, cookie } = await createVerifiedUser(app, mailer.sent);

    const request = await app.inject({
      method: 'POST',
      url: '/api/auth/request-password-reset',
      headers: { origin: APP_ORIGIN },
      payload: { email, redirectTo: '/auth/reset-password' },
    });
    expect(request.statusCode).toBe(200);

    const resetMail = latestEmailTo(mailer.sent, email);
    expect(resetMail.subject).toBe('Reset your Ekana password');
    const link = emailLink(resetMail);
    const callback = await app.inject({ method: 'GET', url: `${link.pathname}${link.search}` });
    expect(callback.statusCode).toBe(302);
    const redirect = new URL(callback.headers.location as string, APP_ORIGIN);
    expect(redirect.pathname).toBe('/auth/reset-password');
    const token = redirect.searchParams.get('token');
    expect(token).toBeTruthy();

    const reset = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      headers: { origin: APP_ORIGIN },
      payload: { newPassword: 'NuevaClave456!', token },
    });
    expect(reset.statusCode).toBe(200);

    expect((await getSession(cookie)).json()).toBeNull();
    expect((await signIn(app, email, DEFAULT_PASSWORD)).statusCode).toBe(401);
    expect((await signIn(app, email, 'NuevaClave456!')).statusCode).toBe(200);
  });
});

describe('protecciones', () => {
  it('rechaza redirecciones a dominios no confiables', async () => {
    const { email } = await createVerifiedUser(app, mailer.sent);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/request-password-reset',
      headers: { origin: APP_ORIGIN },
      payload: { email, redirectTo: 'https://malicioso.test/robar' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('rechaza peticiones con sesión desde un origen no confiable', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie, origin: 'https://malicioso.test' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('limita la tasa de peticiones a /api/auth', async () => {
    const limited = buildApp({ config: { ...baseConfig, auth: { ...baseConfig.auth, rateLimitMax: 3 } }, pool: testPool, mailer });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await signIn(limited, 'nadie@test.local')).statusCode);
    }
    await limited.close();
    expect(statuses.slice(0, 3)).not.toContain(429);
    expect(statuses[3]).toBe(429);
  });
});
