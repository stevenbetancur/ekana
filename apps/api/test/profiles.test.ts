import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import type { MeResponse, ProfileDto, ProfilesResponse } from '@ekana/shared';
import { buildApp } from '../src/app.js';
import { teamMembers, users } from '../src/db/schema/index.js';
import { closeTestDb, resetDb, testDb, testPool } from './helpers/db.js';
import { loadTestConfig } from './helpers/config.js';
import { createFakeMailer } from './helpers/mailer.js';
import { APP_ORIGIN, createVerifiedUser, signUp } from './helpers/auth.js';
import { createTeam } from './helpers/factories.js';

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

function get(url: string, cookie?: string) {
  return app.inject({ method: 'GET', url, headers: cookie ? { cookie, origin: APP_ORIGIN } : {} });
}

function patchProfile(cookie: string, payload: Record<string, unknown>) {
  return app.inject({ method: 'PATCH', url: '/api/v1/me/profile', headers: { cookie, origin: APP_ORIGIN }, payload });
}

describe('GET /api/v1/me', () => {
  it('responde 401 UNAUTHENTICATED sin sesión', async () => {
    const res = await get('/api/v1/me');
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('UNAUTHENTICATED');
  });

  it('devuelve el usuario y su perfil con valores por defecto', async () => {
    const { email, cookie } = await createVerifiedUser(app, mailer.sent, { name: 'Ana' });
    const res = await get('/api/v1/me', cookie);
    expect(res.statusCode).toBe(200);
    const me = res.json<MeResponse>();
    expect(me.user).toMatchObject({ email, name: 'Ana', emailVerified: true });
    expect(me.profile).toMatchObject({
      name: 'Ana',
      profileComplete: false,
      hasActiveTeam: false,
      isPremium: false,
      weeklyHours: 5,
      languages: [{ language: 'English', proficiency: 'Native' }],
    });
  });

  it('calcula hasActiveTeam desde team_members', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    const me = (await get('/api/v1/me', cookie)).json<MeResponse>();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: me.user.id });
    expect((await get('/api/v1/me', cookie)).json<MeResponse>().profile.hasActiveTeam).toBe(true);
  });
});

describe('PATCH /api/v1/me/profile', () => {
  it('fusiona los datos del onboarding sin perder los anteriores', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    await patchProfile(cookie, { subject: 'Data Science', goal: 'Learn new skills', weeklyHours: 10, interests: ['AI'] });
    const res = await patchProfile(cookie, { level: 'Beginner', profileComplete: true });
    expect(res.statusCode).toBe(200);
    expect(res.json<MeResponse>().profile).toMatchObject({
      subject: 'Data Science',
      goal: 'Learn new skills',
      weeklyHours: 10,
      interests: ['AI'],
      level: 'Beginner',
      profileComplete: true,
    });
  });

  it('actualiza el nombre en users y la fecha de nacimiento', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    const res = await patchProfile(cookie, { name: 'Ana María', birthDate: { year: '1995', month: '4', day: '9' } });
    const me = res.json<MeResponse>();
    expect(me.user.name).toBe('Ana María');
    expect(me.profile.birthDate).toEqual({ year: '1995', month: '04', day: '09' });
    expect(me.profile.age).toBeGreaterThanOrEqual(30);
  });

  it('rechaza campos no editables y valores inválidos', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    const thisYear = String(new Date().getFullYear());
    for (const payload of [
      { isPremium: true },
      { hasActiveTeam: true },
      { bio: 'x'.repeat(501) },
      { birthDate: { year: thisYear, month: '1', day: '1' } },
      { birthDate: { year: '2001', month: '2', day: '30' } },
    ]) {
      const res = await patchProfile(cookie, payload);
      expect(res.statusCode, JSON.stringify(payload)).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('GET /api/v1/profiles', () => {
  it('lista perfiles verificados sin datos privados de otros usuarios', async () => {
    const ana = await createVerifiedUser(app, mailer.sent, { name: 'Ana' });
    const luis = await createVerifiedUser(app, mailer.sent, { name: 'Luis' });
    await patchProfile(luis.cookie, { birthDate: { year: '1990', month: '1', day: '15' } });
    await patchProfile(ana.cookie, { birthDate: { year: '1995', month: '4', day: '9' } });
    await signUp(app, { email: 'sin-verificar@test.local', name: 'Pendiente' });

    const res = await get('/api/v1/profiles', ana.cookie);
    expect(res.statusCode).toBe(200);
    const { profiles } = res.json<ProfilesResponse>();
    expect(profiles.map((p) => p.name).sort()).toEqual(['Ana', 'Luis']);
    expect(res.body).not.toContain('@test.local');

    const luisProfile = profiles.find((p) => p.name === 'Luis') as ProfileDto;
    expect(luisProfile.birthDate).toBeNull();
    expect(luisProfile.age).toBeGreaterThanOrEqual(35);
    expect(profiles.find((p) => p.name === 'Ana')?.birthDate).toEqual({ year: '1995', month: '04', day: '09' });
  });

  it('GET /profiles/:id devuelve 404 si no existe y 400 si el id no es un UUID', async () => {
    const { cookie } = await createVerifiedUser(app, mailer.sent);
    expect((await get(`/api/v1/profiles/${crypto.randomUUID()}`, cookie)).statusCode).toBe(404);
    expect((await get('/api/v1/profiles/no-es-uuid', cookie)).statusCode).toBe(400);
  });

  it('GET /profiles/:id devuelve el perfil público de otro usuario', async () => {
    const ana = await createVerifiedUser(app, mailer.sent, { name: 'Ana' });
    const luis = await createVerifiedUser(app, mailer.sent, { name: 'Luis' });
    const [luisRow] = await testDb.select().from(users).where(eq(users.email, luis.email));
    const res = await get(`/api/v1/profiles/${luisRow!.id}`, ana.cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json<ProfileDto>()).toMatchObject({ id: luisRow!.id, name: 'Luis', birthDate: null });
  });
});
