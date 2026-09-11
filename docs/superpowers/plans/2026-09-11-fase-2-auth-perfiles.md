# Fase 2 — Autenticación y perfiles: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar Supabase Auth por autenticación propia (Better Auth sobre nuestra MySQL) con verificación de email obligatoria y recuperación de contraseña por SMTP, y servir los perfiles desde nuestro API (`/api/v1/me`, `/api/v1/profiles`), con el front conectado de punta a punta.

**Architecture:** Better Auth vive dentro del API Fastify (`/api/auth/*`), usa el adaptador Drizzle sobre las tablas `users/sessions/accounts/verifications` ya creadas en la Fase 1 y guarda la sesión en una cookie `httpOnly` del mismo origen que el front (Vercel reescribe `/api/*` a Railway). Los módulos de dominio protegen sus rutas con `requireAuth`, que valida la sesión con `auth.api.getSession`. El front usa el cliente de Better Auth para login/registro/recuperación y `GET /api/v1/me` para construir el usuario.

**Tech Stack:** better-auth 1.7.4 (servidor + `better-auth/react`), nodemailer 10.0.7, Fastify 5, Drizzle 0.45.2, zod 3.25.76, Vitest 4.1.11, React 18 + Vite 5.

**Spec:** `docs/superpowers/specs/2026-09-10-ekana-mysql-migration-design.md` (secciones 4.2, 4.3 y 5).

## Global Constraints

- Todo lo de la Fase 1 sigue vigente (Node 24, versiones fijas, prefijo `/api`, formato de error, BD `ekana`/`ekana_test`, guardia `_test`, secretos solo en `.env`/Railway/GitHub, commits con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`).
- Nuevas dependencias exactas: `better-auth@1.7.4` (API y web), `nodemailer@10.0.7`, `@types/nodemailer@8.0.1`.
- Anteponer `source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 24 >/dev/null &&` a cada comando `npm`/`node` en Git Bash (el shell hereda Node 20).
- Contraseñas de 8 a 128 caracteres. Sesión de 7 días renovada cada 24 h. Verificación de email obligatoria (no hay sesión hasta verificar). Enlace de verificación válido 24 h; enlace de recuperación válido 1 h; al restablecer la contraseña se cierran todas las sesiones.
- `APP_URL` es la URL pública **del front** (`http://localhost:8080` en local, `https://ekana-web.vercel.app` en producción): es el `baseURL` de Better Auth, así que los enlaces de los correos apuntan al front, que reenvía `/api/auth/*` al API.
- Correos en **inglés** (decisión del usuario, coherente con la UI). Textos de la UI en inglés. Los mensajes de error del API siguen en español; el front muestra su propio texto en inglés según el `code`.
- Decisión del usuario: **merge por fase**. Tras esta fase, lo que aún lee de Supabase (equipos, roadmaps, chat, solicitudes, notificaciones) deja de funcionar en producción hasta su fase; no se añaden parches para mantenerlo.
- El perfil público nunca expone `email` ni la fecha de nacimiento exacta (expone `age`). Solo se listan usuarios con email verificado. El usuario no puede auto-asignarse `isPremium` ni `hasActiveTeam` (se calcula desde `team_members`).
- Los tests nunca envían correos reales: `vitest.config.ts` desactiva SMTP y los tests inyectan un `Mailer` falso.

## Estructura de archivos

```
packages/shared/src/
└── profile.ts                     # zod de actualización de perfil, DTOs, ageFromBirthDate
apps/api/src/
├── config.ts                      # + APP_URL, BETTER_AUTH_SECRET, AUTH_RATE_LIMIT_MAX, SMTP_*, EMAIL_FROM
├── app.ts                         # crea db, mailer y auth; registra authRoutes y profileRoutes
├── email/
│   ├── templates.ts               # verificationEmail, resetPasswordEmail (EN, HTML escapado)
│   └── mailer.ts                  # Mailer, createSmtpMailer, createConsoleMailer, createMailer
├── auth/
│   ├── auth.ts                    # createAuth(): configuración de Better Auth
│   ├── routes.ts                  # puente Fastify ↔ auth.handler en /api/auth/*
│   └── session.ts                 # requireAuth(), currentUser()
└── modules/profiles/
    ├── mapper.ts                  # filas → ProfileDto (público/privado)
    ├── service.ts                 # ensureProfile, getMe, updateMyProfile, listProfiles, getProfile
    └── routes.ts                  # GET /me, PATCH /me/profile, GET /profiles, GET /profiles/:id
apps/api/test/
├── helpers/{mailer.ts, auth.ts}
├── email.test.ts, auth.test.ts, profiles.test.ts
apps/web/src/
├── lib/auth-client.ts             # createAuthClient
├── contexts/AuthContext.tsx       # reescrito sobre Better Auth + /api/v1/me
├── contexts/UserProfileContext.tsx# carga perfiles solo con sesión
├── pages/Auth.tsx                 # verificación pendiente, reenvío, errores de enlace, 8 caracteres
├── pages/ResetPassword.tsx        # nueva contraseña desde el enlace del correo
├── services/userProfile/{userProfile.api.ts, index.ts, types.ts}
├── hooks/useMockData.ts           # useAllUsers/useUser basados en perfiles reales
└── services/health/health.service.ts
```

---

### Task 1: Configuración de auth y correo en el API

**Files:**
- Modify: `apps/api/package.json`, `apps/api/src/config.ts`, `apps/api/.env.example`, `apps/api/vitest.config.ts`, `apps/api/test/config.test.ts`, `apps/api/test/helpers/config.ts`
- Create: `apps/api/src/email/templates.ts`, `apps/api/src/email/mailer.ts`, `apps/api/test/helpers/mailer.ts`
- Test: `apps/api/test/email.test.ts`

**Interfaces:**
- Produces:
  - `Config` añade `appUrl: string`, `auth: { secret: string; rateLimitMax: number }`, `smtp: SmtpConfig | null`, `emailFrom: string`; `type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string }`.
  - `interface EmailContent { subject: string; html: string; text: string }`, `verificationEmail({ name, url }): EmailContent`, `resetPasswordEmail({ name, url }): EmailContent`.
  - `interface EmailMessage extends EmailContent { to: string }`, `interface Mailer { send(message: EmailMessage): Promise<void> }`, `createSmtpMailer(smtp, from)`, `createConsoleMailer(log?)`, `createMailer(config)`.
  - Test: `createFakeMailer(): Mailer & { sent: EmailMessage[] }`, `emailLink(message): URL`.

- [ ] **Step 1: Dependencias**

Run: `npm install -w @ekana/api better-auth@1.7.4 nodemailer@10.0.7 && npm install -w @ekana/api -D @types/nodemailer@8.0.1`
Expected: sin errores; `apps/api/package.json` las lista con versión exacta (si npm añade `^`, quitarlo a mano).

- [ ] **Step 2: Tests de configuración (fallan)**

En `apps/api/test/config.test.ts`, cambiar `base` a:
```ts
const base = {
  DB_HOST: 'db.local',
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'ekana',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
};
```
y añadir al final del `describe('loadConfig', ...)`:
```ts
  it('aplica los valores por defecto de auth y correo', () => {
    const config = loadConfig(base);
    expect(config.appUrl).toBe('http://localhost:8080');
    expect(config.auth).toEqual({ secret: 'x'.repeat(32), rateLimitMax: 20 });
    expect(config.smtp).toBeNull();
    expect(config.emailFrom).toBe('Ekana <no-reply@localhost>');
  });

  it('configura SMTP solo si host, usuario y contraseña tienen valor', () => {
    const smtpEnv = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'a@b.com', SMTP_PASS: 'secret' };
    expect(loadConfig({ ...base, ...smtpEnv }).smtp).toEqual({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'a@b.com',
      pass: 'secret',
    });
    expect(loadConfig({ ...base, ...smtpEnv, SMTP_PASS: '' }).smtp).toBeNull();
  });

  it('exige SMTP en producción', () => {
    expect(() => loadConfig({ ...base, NODE_ENV: 'production' })).toThrow(/SMTP_HOST/);
  });

  it('exige un BETTER_AUTH_SECRET de al menos 32 caracteres', () => {
    expect(() => loadConfig({ ...base, BETTER_AUTH_SECRET: 'corto' })).toThrow(/BETTER_AUTH_SECRET/);
  });

  it('normaliza APP_URL sin barra final', () => {
    expect(loadConfig({ ...base, APP_URL: 'https://ekana-web.vercel.app/' }).appUrl).toBe('https://ekana-web.vercel.app');
  });
```

En `apps/api/test/helpers/config.ts`, añadir `BETTER_AUTH_SECRET: 'test-secret-que-solo-se-usa-en-tests-0123456789',` dentro del objeto de `makeTestConfig` (antes de `...overrides`).

Run: `npm run build:shared && npm run test -w @ekana/api -- test/config.test.ts`
Expected: FAIL (propiedades `appUrl`, `auth`, `smtp` inexistentes).

- [ ] **Step 3: Implementar la configuración**

En `apps/api/src/config.ts`:
- después de `const csv = ...` añadir:
```ts
// dotenv convierte `SMTP_PASS=` en '': lo tratamos como "no definido".
const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());
const urlWithoutTrailingSlash = z
  .string()
  .url()
  .transform((value) => value.replace(/\/+$/, ''));
```
- reemplazar `const envSchema = z.object({ ... });` por el mismo objeto con estos campos añadidos al final y un `superRefine`:
```ts
  APP_URL: urlWithoutTrailingSlash.default('http://localhost:8080'),
  BETTER_AUTH_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanString.default('false'),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: z.string().min(1).default('Ekana <no-reply@localhost>'),
})
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'] as const) {
      if (!env[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: 'obligatorio en producción' });
    }
  });
```
- añadir el tipo y extender `Config`:
```ts
export type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };
```
```ts
  appUrl: string;
  auth: { secret: string; rateLimitMax: number };
  smtp: SmtpConfig | null;
  emailFrom: string;
```
- en el `return` de `loadConfig`, añadir:
```ts
    appUrl: e.APP_URL,
    auth: { secret: e.BETTER_AUTH_SECRET, rateLimitMax: e.AUTH_RATE_LIMIT_MAX },
    smtp:
      e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS
        ? { host: e.SMTP_HOST, port: e.SMTP_PORT, secure: e.SMTP_SECURE, user: e.SMTP_USER, pass: e.SMTP_PASS }
        : null,
    emailFrom: e.EMAIL_FROM,
```

En `apps/api/vitest.config.ts`, después de fijar `DB_NAME`, añadir:
```ts
// Auth determinista y sin correos reales en los tests.
process.env.APP_URL = 'http://localhost:8080';
process.env.BETTER_AUTH_SECRET ??= 'test-secret-que-solo-se-usa-en-tests-0123456789';
process.env.SMTP_HOST = '';
```

En `apps/api/.env.example`, añadir al final:
```
APP_URL=http://localhost:8080
# Genera uno con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
BETTER_AUTH_SECRET=
AUTH_RATE_LIMIT_MAX=20

# Sin SMTP_HOST/USER/PASS los correos se imprimen en consola (solo desarrollo).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Ekana <ekana@ekana.com.co>
```

Run: `npm run test -w @ekana/api -- test/config.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 4: Tests de plantillas de correo (fallan)**

`apps/api/test/helpers/mailer.ts`:
```ts
import type { EmailMessage, Mailer } from '../../src/email/mailer.js';

export function createFakeMailer(): Mailer & { sent: EmailMessage[] } {
  const sent: EmailMessage[] = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

export function emailLink(message: EmailMessage): URL {
  const match = message.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`El correo "${message.subject}" no contiene enlace`);
  return new URL(match[0]);
}
```

`apps/api/test/email.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { resetPasswordEmail, verificationEmail } from '../src/email/templates.js';

const url = 'http://localhost:8080/api/auth/verify-email?token=abc&callbackURL=%2Fonboarding';

describe('plantillas de correo', () => {
  it('el correo de verificación incluye el enlace en texto y HTML', () => {
    const email = verificationEmail({ name: 'Ana', url });
    expect(email.subject).toBe('Verify your Ekana email');
    expect(email.text).toContain(url);
    expect(email.text).toContain('Hi Ana');
    expect(email.html).toContain(url.replace(/&/g, '&amp;'));
  });

  it('el correo de recuperación indica que expira en 1 hora', () => {
    const email = resetPasswordEmail({ name: 'Ana', url });
    expect(email.subject).toBe('Reset your Ekana password');
    expect(email.text).toContain(url);
    expect(email.text).toContain('1 hour');
  });

  it('escapa el nombre en el HTML', () => {
    const email = verificationEmail({ name: '<script>alert(1)</script>', url });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
```

Run: `npm run test -w @ekana/api -- test/email.test.ts`
Expected: FAIL (módulo inexistente).

- [ ] **Step 5: Implementar plantillas y mailer**

`apps/api/src/email/templates.ts`:
```ts
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

function layout({ heading, intro, action, url, footer }: { heading: string; intro: string; action: string; url: string; footer: string }) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f1a2e">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px">
          <tr><td>
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#6d28d9">Ekana</p>
            <h1 style="margin:0 0 16px;font-size:22px">${heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.5">${intro}</p>
            <p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${action}</a></p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b6280">If the button doesn't work, copy this link into your browser:</p>
            <p style="margin:0 0 24px;font-size:13px;word-break:break-all"><a href="${safeUrl}" style="color:#6d28d9">${safeUrl}</a></p>
            <p style="margin:0;font-size:13px;color:#6b6280">${footer}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail({ name, url }: { name: string; url: string }): EmailContent {
  const footer = "This link expires in 24 hours. If you didn't create an Ekana account, you can ignore this email.";
  return {
    subject: 'Verify your Ekana email',
    text: `Hi ${name},\n\nWelcome to Ekana! Confirm your email address to activate your account:\n${url}\n\n${footer}`,
    html: layout({
      heading: `Hi ${escapeHtml(name)}, welcome to Ekana!`,
      intro: 'Confirm your email address to activate your account and start learning with your team.',
      action: 'Verify email',
      url,
      footer,
    }),
  };
}

export function resetPasswordEmail({ name, url }: { name: string; url: string }): EmailContent {
  const footer = "This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.";
  return {
    subject: 'Reset your Ekana password',
    text: `Hi ${name},\n\nWe received a request to reset your Ekana password. Choose a new one here:\n${url}\n\n${footer}`,
    html: layout({
      heading: `Hi ${escapeHtml(name)},`,
      intro: 'We received a request to reset your Ekana password. Click the button to choose a new one.',
      action: 'Reset password',
      url,
      footer,
    }),
  };
}
```

`apps/api/src/email/mailer.ts`:
```ts
import nodemailer from 'nodemailer';
import type { Config, SmtpConfig } from '../config.js';
import type { EmailContent } from './templates.js';

export interface EmailMessage extends EmailContent {
  to: string;
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}

export function createSmtpMailer(smtp: SmtpConfig, from: string): Mailer {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return {
    async send(message) {
      await transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
    },
  };
}

// Solo desarrollo: config.ts exige SMTP en producción.
export function createConsoleMailer(log: (line: string) => void = console.info): Mailer {
  return {
    async send(message) {
      log(`\n[email] Para: ${message.to}\n[email] Asunto: ${message.subject}\n${message.text}\n`);
    },
  };
}

export function createMailer(config: Config): Mailer {
  return config.smtp ? createSmtpMailer(config.smtp, config.emailFrom) : createConsoleMailer();
}
```

Run: `npm test && npm run typecheck`
Expected: PASS de toda la suite (los tests existentes siguen verdes) y typecheck limpio.

- [ ] **Step 6: Commit**

```bash
git add apps/api/package.json package-lock.json apps/api/src/config.ts apps/api/src/email apps/api/.env.example apps/api/vitest.config.ts apps/api/test/config.test.ts apps/api/test/helpers/config.ts apps/api/test/helpers/mailer.ts apps/api/test/email.test.ts
git commit -m "feat(api): configuración de auth/SMTP y plantillas de correo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Better Auth en el API (registro, verificación, login, recuperación)

**Files:**
- Create: `apps/api/src/auth/auth.ts`, `apps/api/src/auth/routes.ts`, `apps/api/src/auth/session.ts`, `apps/api/src/modules/profiles/service.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/test/helpers/auth.ts`
- Test: `apps/api/test/auth.test.ts`

**Interfaces:**
- Consumes: `Config`, `Mailer`, plantillas, `createDb`/`Db`, tablas `users/sessions/accounts/verifications/profiles`, `unauthenticated()`.
- Produces:
  - `createAuth({ db, config, mailer, log }): Auth` y `type Auth`.
  - `authRoutes({ auth, config }): FastifyPluginAsync` (montado con prefijo `/api` → `/api/auth/*`).
  - `interface AuthUser { id: string; email: string; name: string; emailVerified: boolean; image: string | null }`, `requireAuth(auth): preHandlerAsyncHookHandler`, `currentUser(request): AuthUser`.
  - `ensureProfile(db, userId): Promise<void>` (idempotente).
  - `buildApp` pasa a `AppDeps = { config: Config; pool: Pool; mailer?: Mailer }`.
  - Helpers de test: `APP_ORIGIN`, `cookieHeader(res)`, `signUp(app, input)`, `signIn(app, email, password)`, `verifyLatestEmail(app, mailer, email)`, `createVerifiedUser(app, mailer, input?)`.

- [ ] **Step 1: Helpers y tests de auth (fallan)**

`apps/api/test/helpers/auth.ts`:
```ts
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
```

`apps/api/test/auth.test.ts`:
```ts
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
```

Run: `npm run test -w @ekana/api -- test/auth.test.ts`
Expected: FAIL (`buildApp` no expone `/api/auth/*`).

- [ ] **Step 2: `ensureProfile`**

`apps/api/src/modules/profiles/service.ts`:
```ts
import type { Db } from '../../db/client.js';
import { profiles } from '../../db/schema/index.js';

// Idempotente: el hook de registro lo llama y GET /me lo vuelve a asegurar por si el hook falló.
export async function ensureProfile(db: Db, userId: string): Promise<void> {
  await db.insert(profiles).ignore().values({ id: userId });
}
```

- [ ] **Step 3: Configuración de Better Auth**

`apps/api/src/auth/auth.ts`:
```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { FastifyBaseLogger } from 'fastify';
import type { Config } from '../config.js';
import type { Db } from '../db/client.js';
import { accounts, sessions, users, verifications } from '../db/schema/index.js';
import type { EmailMessage, Mailer } from '../email/mailer.js';
import { resetPasswordEmail, verificationEmail } from '../email/templates.js';
import { ensureProfile } from '../modules/profiles/service.js';

const DAY = 60 * 60 * 24;

interface AuthDeps {
  db: Db;
  config: Config;
  mailer: Mailer;
  log: FastifyBaseLogger;
}

export function createAuth({ db, config, mailer, log }: AuthDeps) {
  // No se espera el envío: responder igual exista o no la cuenta evita filtrar información por tiempos.
  const sendInBackground = (message: EmailMessage) => {
    mailer.send(message).catch((error: unknown) => {
      log.error({ err: error, subject: message.subject }, 'No se pudo enviar el correo');
    });
  };

  return betterAuth({
    appName: 'Ekana',
    baseURL: config.appUrl,
    basePath: '/api/auth',
    secret: config.auth.secret,
    trustedOrigins: [...new Set([config.appUrl, ...config.corsOrigins])],
    database: drizzleAdapter(db, {
      provider: 'mysql',
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    advanced: { database: { generateId: 'uuid' } },
    // El rate limit lo aplica Fastify (por IP, configurable con AUTH_RATE_LIMIT_MAX).
    rateLimit: { enabled: false },
    session: { expiresIn: 7 * DAY, updateAge: DAY },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        sendInBackground({ to: user.email, ...resetPasswordEmail({ name: user.name, url }) });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: DAY,
      sendVerificationEmail: async ({ user, url }) => {
        sendInBackground({ to: user.email, ...verificationEmail({ name: user.name, url }) });
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureProfile(db, user.id);
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

- [ ] **Step 4: Puente Fastify ↔ Better Auth y sesión**

`apps/api/src/auth/routes.ts`:
```ts
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
```

`apps/api/src/auth/session.ts`:
```ts
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
```

- [ ] **Step 5: Conectar en `buildApp`**

En `apps/api/src/app.ts`:
- imports nuevos:
```ts
import { createAuth } from './auth/auth.js';
import { authRoutes } from './auth/routes.js';
import { createDb } from './db/client.js';
import { createMailer, type Mailer } from './email/mailer.js';
```
- `AppDeps` pasa a:
```ts
export interface AppDeps {
  config: Config;
  pool: Pool;
  mailer?: Mailer;
}
```
- firma: `export function buildApp({ config, pool, mailer }: AppDeps): FastifyInstance {`
- después del `app.register(rateLimit, ...)` y antes de las rutas de health:
```ts
  const db = createDb(pool);
  const auth = createAuth({ db, config, mailer: mailer ?? createMailer(config), log: app.log });
  app.register(authRoutes({ auth, config }), { prefix: '/api' });
```

Run: `npm run test -w @ekana/api -- test/auth.test.ts`
Expected: PASS (10 tests). Si algún código de error de Better Auth difiere (p. ej. el de origen no confiable), ajustar solo la aserción al código real documentándolo en el test, nunca relajar el status esperado de rechazo.

- [ ] **Step 6: Suite completa, typecheck y commit**

Run: `npm test && npm run typecheck`
Expected: PASS y typecheck limpio.

```bash
git add apps/api/src/auth apps/api/src/modules/profiles/service.ts apps/api/src/app.ts apps/api/test/helpers/auth.ts apps/api/test/auth.test.ts
git commit -m "feat(api): Better Auth con verificación de email, recuperación de contraseña y rate limit

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: API de perfiles (`/api/v1/me` y `/api/v1/profiles`)

**Files:**
- Create: `packages/shared/src/profile.ts`
- Modify: `packages/shared/src/index.ts`, `apps/api/src/modules/profiles/service.ts`, `apps/api/src/app.ts`
- Create: `apps/api/src/modules/profiles/mapper.ts`, `apps/api/src/modules/profiles/routes.ts`
- Test: `apps/api/test/profiles.test.ts`

**Interfaces:**
- Produces (shared): `MIN_AGE`, `BirthDate`, `ageFromBirthDate(b, now?)`, `birthDateSchema`, `profileUpdateSchema`, `ProfileUpdate`, `ProfileDto`, `MeResponse`, `ProfilesResponse`.
- Produces (API): `toProfileDto(user, profile, hasActiveTeam, { includePrivate })`, `getMe(db, userId)`, `updateMyProfile(db, userId, patch)`, `listProfiles(db, viewerId)`, `getProfile(db, viewerId, id)`, `profileRoutes({ db, auth })` montado en `/api/v1`.

- [ ] **Step 1: Contrato compartido**

`packages/shared/src/profile.ts`:
```ts
import { z } from 'zod';

export const MIN_AGE = 13;

export interface BirthDate {
  year: string;
  month: string;
  day: string;
}

export function ageFromBirthDate(birthDate: BirthDate, now: Date = new Date()): number | null {
  const year = Number(birthDate.year);
  const month = Number(birthDate.month);
  const day = Number(birthDate.day);
  if (!year || !month || !day) return null;
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age--;
  return age;
}

function isRealDate({ year, month, day }: BirthDate): boolean {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)
  );
}

export const birthDateSchema = z
  .object({
    year: z.string().regex(/^\d{4}$/),
    month: z.string().regex(/^\d{1,2}$/),
    day: z.string().regex(/^\d{1,2}$/),
  })
  .refine(isRealDate, { message: 'Fecha de nacimiento inválida' })
  .refine((birthDate) => Number(birthDate.year) >= 1900, { message: 'Año de nacimiento inválido' })
  .refine((birthDate) => (ageFromBirthDate(birthDate) ?? 0) >= MIN_AGE, {
    message: `Debes tener al menos ${MIN_AGE} años`,
  });

const shortText = (max: number) => z.string().trim().max(max);

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    avatar: z.union([z.string().url().max(2048), z.literal('')]),
    bio: z.string().max(500),
    location: shortText(100),
    birthDate: birthDateSchema.nullable(),
    subject: shortText(100),
    goal: shortText(100),
    level: shortText(50),
    weeklyHours: z.number().int().min(0).max(168),
    communicationMethods: z.array(shortText(50)).max(20),
    languages: z
      .array(z.object({ language: z.string().trim().min(1).max(50), proficiency: z.string().trim().min(1).max(30) }))
      .max(20),
    interests: z.array(shortText(50)).max(50),
    availability: z.array(shortText(50)).max(50),
    schedule: z.object({ weekdays: z.array(shortText(30)).max(10), weekend: z.array(shortText(30)).max(10) }),
    activeCourse: shortText(255),
    profileComplete: z.boolean(),
  })
  .partial()
  .strict();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export interface ProfileDto {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  /** Solo en el perfil propio; para otros usuarios es null (se expone `age`). */
  birthDate: BirthDate | null;
  age: number | null;
  subject: string;
  goal: string;
  level: string;
  weeklyHours: number;
  communicationMethods: string[];
  languages: { language: string; proficiency: string }[];
  interests: string[];
  availability: string[];
  schedule: { weekdays: string[]; weekend: string[] };
  isPremium: boolean;
  profileComplete: boolean;
  hasActiveTeam: boolean;
  activeCourse: string | null;
}

export interface MeResponse {
  user: { id: string; email: string; name: string; image: string | null; emailVerified: boolean };
  profile: ProfileDto;
}

export interface ProfilesResponse {
  profiles: ProfileDto[];
}
```

`packages/shared/src/index.ts`: añadir `export * from './profile.js';`.

Run: `npm run build:shared`
Expected: compila sin errores.

- [ ] **Step 2: Tests de perfiles (fallan)**

`apps/api/test/profiles.test.ts`:
```ts
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
```

Run: `npm run test -w @ekana/api -- test/profiles.test.ts`
Expected: FAIL (rutas `/api/v1/*` inexistentes → 404).

- [ ] **Step 3: Mapper**

`apps/api/src/modules/profiles/mapper.ts`:
```ts
import { ageFromBirthDate, type BirthDate, type ProfileDto } from '@ekana/shared';
import type { profiles, users } from '../../db/schema/index.js';

type UserRow = typeof users.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

const DEFAULT_LANGUAGES = [{ language: 'English', proficiency: 'Native' }];
const DEFAULT_WEEKLY_HOURS = 5;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function asLanguages(value: unknown): ProfileDto['languages'] {
  if (!Array.isArray(value)) return DEFAULT_LANGUAGES;
  return value.filter(
    (item): item is { language: string; proficiency: string } =>
      typeof item === 'object' && item !== null && typeof item.language === 'string' && typeof item.proficiency === 'string',
  );
}

export function parseBirthDate(value: string | null): BirthDate | null {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return year && month && day ? { year, month, day } : null;
}

export function formatBirthDate(birthDate: BirthDate): string {
  return `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
}

export function toProfileDto(
  user: UserRow,
  profile: ProfileRow,
  hasActiveTeam: boolean,
  { includePrivate }: { includePrivate: boolean },
): ProfileDto {
  const onboarding = profile.onboardingData;
  const preferences = profile.preferences;
  const birthDate = parseBirthDate(profile.birthDate);
  return {
    id: user.id,
    name: user.name,
    avatar: user.image ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    birthDate: includePrivate ? birthDate : null,
    age: birthDate ? ageFromBirthDate(birthDate) : null,
    subject: asString(onboarding.subject),
    goal: asString(onboarding.goal),
    level: asString(onboarding.level),
    weeklyHours: typeof onboarding.weeklyHours === 'number' ? onboarding.weeklyHours : DEFAULT_WEEKLY_HOURS,
    communicationMethods: asStringArray(onboarding.communicationMethods),
    languages: asLanguages(preferences.languages),
    interests: asStringArray(preferences.interests),
    availability: asStringArray(preferences.availability),
    schedule: { weekdays: asStringArray(profile.schedule.weekdays), weekend: asStringArray(profile.schedule.weekend) },
    isPremium: profile.isPremium,
    profileComplete: profile.profileComplete,
    hasActiveTeam,
    activeCourse: profile.activeCourse ?? null,
  };
}
```

- [ ] **Step 4: Servicio**

`apps/api/src/modules/profiles/service.ts` (reemplazar completo):
```ts
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { MeResponse, ProfileDto, ProfileUpdate } from '@ekana/shared';
import type { Db } from '../../db/client.js';
import { profiles, teamMembers, users } from '../../db/schema/index.js';
import { notFound } from '../../lib/errors.js';
import { formatBirthDate, toProfileDto } from './mapper.js';

const MAX_PROFILES = 500;

// Idempotente: el hook de registro lo llama y GET /me lo vuelve a asegurar por si el hook falló.
export async function ensureProfile(db: Db, userId: string): Promise<void> {
  await db.insert(profiles).ignore().values({ id: userId });
}

function selectProfiles(db: Db, where: SQL | undefined, limit: number) {
  return db
    .select({
      user: users,
      profile: profiles,
      hasActiveTeam: sql<number>`exists(select 1 from ${teamMembers} where ${teamMembers.userId} = ${users.id})`,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.id, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getMe(db: Db, userId: string): Promise<MeResponse> {
  await ensureProfile(db, userId);
  const [row] = await selectProfiles(db, eq(users.id, userId), 1);
  if (!row) throw notFound('Usuario no encontrado');
  const { user } = row;
  return {
    user: { id: user.id, email: user.email, name: user.name, image: user.image ?? null, emailVerified: user.emailVerified },
    profile: toProfileDto(user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: true }),
  };
}

export async function listProfiles(db: Db, viewerId: string): Promise<ProfileDto[]> {
  const rows = await selectProfiles(db, eq(users.emailVerified, true), MAX_PROFILES);
  return rows.map((row) =>
    toProfileDto(row.user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: row.user.id === viewerId }),
  );
}

export async function getProfile(db: Db, viewerId: string, id: string): Promise<ProfileDto> {
  const [row] = await selectProfiles(db, and(eq(users.id, id), eq(users.emailVerified, true)), 1);
  if (!row) throw notFound('Usuario no encontrado');
  return toProfileDto(row.user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: id === viewerId });
}

function withDefined(base: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown> {
  return { ...base, ...Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined)) };
}

export async function updateMyProfile(db: Db, userId: string, patch: ProfileUpdate): Promise<MeResponse> {
  await ensureProfile(db, userId);
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(profiles).where(eq(profiles.id, userId)).for('update');
    if (!current) throw notFound('Perfil no encontrado');

    const userChanges: Partial<typeof users.$inferInsert> = {};
    if (patch.name !== undefined) userChanges.name = patch.name;
    if (patch.avatar !== undefined) userChanges.image = patch.avatar === '' ? null : patch.avatar;
    if (Object.keys(userChanges).length > 0) await tx.update(users).set(userChanges).where(eq(users.id, userId));

    const profileChanges: Partial<typeof profiles.$inferInsert> = {
      onboardingData: withDefined(current.onboardingData, {
        subject: patch.subject,
        goal: patch.goal,
        level: patch.level,
        weeklyHours: patch.weeklyHours,
        communicationMethods: patch.communicationMethods,
      }),
      preferences: withDefined(current.preferences, {
        languages: patch.languages,
        interests: patch.interests,
        availability: patch.availability,
      }),
      schedule: patch.schedule ? { ...current.schedule, ...patch.schedule } : current.schedule,
    };
    if (patch.bio !== undefined) profileChanges.bio = patch.bio;
    if (patch.location !== undefined) profileChanges.location = patch.location;
    if (patch.birthDate !== undefined) profileChanges.birthDate = patch.birthDate ? formatBirthDate(patch.birthDate) : null;
    if (patch.activeCourse !== undefined) profileChanges.activeCourse = patch.activeCourse;
    if (patch.profileComplete !== undefined) profileChanges.profileComplete = patch.profileComplete;
    await tx.update(profiles).set(profileChanges).where(eq(profiles.id, userId));
  });
  return getMe(db, userId);
}
```

- [ ] **Step 5: Rutas y registro**

`apps/api/src/modules/profiles/routes.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { profileUpdateSchema, type MeResponse, type ProfileDto, type ProfilesResponse } from '@ekana/shared';
import type { Auth } from '../../auth/auth.js';
import { currentUser, requireAuth } from '../../auth/session.js';
import type { Db } from '../../db/client.js';
import { getMe, getProfile, listProfiles, updateMyProfile } from './service.js';

const idParamsSchema = z.object({ id: z.string().uuid() });

export function profileRoutes({ db, auth }: { db: Db; auth: Auth }): FastifyPluginAsync {
  return async (app) => {
    app.addHook('preHandler', requireAuth(auth));

    app.get('/me', async (request): Promise<MeResponse> => getMe(db, currentUser(request).id));

    app.patch('/me/profile', async (request): Promise<MeResponse> =>
      updateMyProfile(db, currentUser(request).id, profileUpdateSchema.parse(request.body ?? {})),
    );

    app.get('/profiles', async (request): Promise<ProfilesResponse> => ({
      profiles: await listProfiles(db, currentUser(request).id),
    }));

    app.get('/profiles/:id', async (request): Promise<ProfileDto> => {
      const { id } = idParamsSchema.parse(request.params);
      return getProfile(db, currentUser(request).id, id);
    });
  };
}
```

En `apps/api/src/app.ts`: añadir `import { profileRoutes } from './modules/profiles/routes.js';` y, justo después de registrar `authRoutes`:
```ts
  app.register(profileRoutes({ db, auth }), { prefix: '/api/v1' });
```

Run: `npm run test -w @ekana/api -- test/profiles.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Suite completa, typecheck y commit**

Run: `npm test && npm run typecheck`
Expected: PASS y typecheck limpio.

```bash
git add packages/shared/src apps/api/src/modules/profiles apps/api/src/app.ts apps/api/test/profiles.test.ts
git commit -m "feat(api): /api/v1/me y /api/v1/profiles con perfil público sin datos privados

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Front — cliente de auth y `AuthContext`

**Files:**
- Modify: `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/tsconfig.json`, `apps/web/tsconfig.app.json`, `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/lib/mockData.ts`
- Create: `apps/web/src/lib/auth-client.ts`

**Interfaces:**
- Consumes: `MeResponse` de `@ekana/shared`, `api`/`ApiError` de `@/lib/api`, endpoints de Better Auth.
- Produces: `useAuth()` con `user`, `loading`, `error`, `login`, `signup`, `logout`, `updateUser`, `refreshUser`, `resetPassword(email)`, `confirmPasswordReset(token, newPassword)`, `resendVerification(email)`, `clearError`, `hasActiveEntitlement`. Los métodos asíncronos devuelven `AuthResult = { error: Error | null; code?: string }`. Se elimina `session` (sin consumidores). `User` (mockData y AuthContext) añade `age?: number | null`.

- [ ] **Step 1: Dependencia y alias de `@ekana/shared`**

Run: `npm install -w @ekana/web better-auth@1.7.4`
Expected: sin errores (quitar `^` si npm lo añade).

`apps/web/vite.config.ts`: en `resolve.alias` añadir, tras `"@"`:
```ts
      // Contrato compartido con el API, compilado desde el código fuente.
      "@ekana/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
```

En `apps/web/tsconfig.json` y `apps/web/tsconfig.app.json`, dentro de `compilerOptions.paths`, añadir:
```json
      "@ekana/shared": ["../../packages/shared/src/index.ts"],
```

En `apps/web/src/lib/mockData.ts`, dentro de `export interface User`, tras `location?: string;` añadir:
```ts
  age?: number | null;
```

- [ ] **Step 2: Cliente de Better Auth**

`apps/web/src/lib/auth-client.ts`:
```ts
import { createAuthClient } from "better-auth/react";

// Mismo origen que el front: Vite (local) y Vercel (producción) reenvían /api/auth al API.
export const authClient = createAuthClient({ baseURL: window.location.origin });
```

- [ ] **Step 3: Reescribir `AuthContext.tsx`**

`apps/web/src/contexts/AuthContext.tsx` (reemplazar completo):
```tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { MeResponse } from '@ekana/shared';
import { authClient } from '@/lib/auth-client';
import { api, ApiError } from '@/lib/api';
import { analyticsService } from '@/services/analytics';

// User type that components consume
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
  profileComplete: boolean;
  hasActiveTeam: boolean;
  activeCourse?: string;
  bio?: string;
  interests?: string[];
  languages?: Array<{ language: string; proficiency: string }>;
  weeklyHours?: number;
  availability?: string[];
  communicationMethods?: string[];
  level?: string;
  goal?: "Change careers" | "Have fun" | "Learn new skills" | "Start a new career";
  subject?: string;
  customSubject?: string;
  schedule?: { weekdays: string[]; weekend: string[] };
  birthDate?: { month: string; day: string; year: string };
  age?: number | null;
  location?: string;
}

export interface AuthResult {
  error: Error | null;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  clearError: () => void;
  hasActiveEntitlement: (userId: string, roadmapId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const VERIFY_CALLBACK = '/onboarding';
const RESET_CALLBACK = '/auth/reset-password';

const FRIENDLY_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password. Please try again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email first. We just sent you a new verification link.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Try signing in.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Try signing in.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_TOO_LONG: 'Password must be at most 128 characters long.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_TOKEN: 'This link is invalid or has expired. Please request a new one.',
  TOKEN_EXPIRED: 'This link is invalid or has expired. Please request a new one.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
};

function toFriendly(error: { code?: string; message?: string; status?: number }): { code?: string; message: string } {
  const code = error.code ?? (error.status === 429 ? 'RATE_LIMITED' : undefined);
  return { code, message: (code && FRIENDLY_MESSAGES[code]) || error.message || 'Something went wrong. Please try again.' };
}

function toUser({ user, profile }: MeResponse): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name || 'User',
    avatar: profile.avatar || undefined,
    isPremium: profile.isPremium,
    profileComplete: profile.profileComplete,
    hasActiveTeam: profile.hasActiveTeam,
    activeCourse: profile.activeCourse ?? undefined,
    bio: profile.bio,
    interests: profile.interests,
    languages: profile.languages,
    weeklyHours: profile.weeklyHours,
    availability: profile.availability,
    communicationMethods: profile.communicationMethods,
    level: profile.level,
    goal: profile.goal as User['goal'],
    subject: profile.subject,
    schedule: profile.schedule,
    birthDate: profile.birthDate ?? undefined,
    age: profile.age,
    location: profile.location,
  };
}

async function fetchCurrentUser(): Promise<User | null> {
  try {
    return toUser(await api.get<MeResponse>('/v1/me'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch((err) => console.error('Failed to load the current session:', err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const fail = (err: { code?: string; message?: string; status?: number }): AuthResult => {
    const friendly = toFriendly(err);
    setError(friendly.message);
    return { error: new Error(friendly.message), code: friendly.code };
  };

  const refreshUser = useCallback(async () => {
    setUser(await fetchCurrentUser());
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    if (signInError) return fail(signInError);
    const current = await fetchCurrentUser();
    setUser(current);
    if (current) analyticsService.trackEvent(current.id, { eventType: 'login' });
    return { error: null };
  };

  const signup = async (email: string, password: string, name: string): Promise<AuthResult> => {
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({ email, password, name, callbackURL: VERIFY_CALLBACK });
    if (signUpError) return fail(signUpError);
    return { error: null };
  };

  const logout = async (): Promise<void> => {
    if (user) analyticsService.trackEvent(user.id, { eventType: 'logout' });
    await authClient.signOut();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    setError(null);
    const { error: resetError } = await authClient.requestPasswordReset({ email, redirectTo: RESET_CALLBACK });
    if (resetError) return fail(resetError);
    return { error: null };
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<AuthResult> => {
    setError(null);
    const { error: resetError } = await authClient.resetPassword({ token, newPassword });
    if (resetError) return fail(resetError);
    return { error: null };
  };

  const resendVerification = async (email: string): Promise<AuthResult> => {
    setError(null);
    const { error: sendError } = await authClient.sendVerificationEmail({ email, callbackURL: VERIFY_CALLBACK });
    if (sendError) return fail(sendError);
    return { error: null };
  };

  const clearError = () => setError(null);

  // Check if user has entitlement to a roadmap (for paid content). Se implementa en la fase de roadmaps.
  const hasActiveEntitlement = (_userId: string, _roadmapId: string): boolean => true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateUser,
        refreshUser,
        resetPassword,
        confirmPasswordReset,
        resendVerification,
        clearError,
        hasActiveEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

- [ ] **Step 4: Verificar build y commit**

Run: `npm run build:web`
Expected: `✓ built`.

```bash
git add apps/web/package.json package-lock.json apps/web/vite.config.ts apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/src/lib/auth-client.ts apps/web/src/contexts/AuthContext.tsx apps/web/src/lib/mockData.ts
git commit -m "feat(web): AuthContext sobre Better Auth y /api/v1/me

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Front — pantallas de autenticación

**Files:**
- Modify: `apps/web/src/pages/Auth.tsx`, `apps/web/src/App.tsx`
- Create: `apps/web/src/pages/ResetPassword.tsx`

**Interfaces:**
- Consumes: `useAuth()` de la Tarea 4.
- Produces: ruta pública `/auth/reset-password?token=...` (o `?error=INVALID_TOKEN`). `/auth` interpreta `?error=` (enlace de verificación inválido o caducado).

- [ ] **Step 1: `Auth.tsx`**

Cambios sobre el archivo actual (conservar estructura y estilos):
1. Import: `import { useNavigate, useSearchParams } from "react-router-dom";` y añadir `resendVerification` al destructuring de `useAuth()`.
2. Nuevos estados bajo los existentes:
```tsx
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const linkError = searchParams.get("error");
```
3. Helper de reenvío (con enfriamiento de 30 s para evitar spam):
```tsx
  const handleResend = async (email: string) => {
    if (!email || resendCooldown) return;
    setResendCooldown(true);
    const { error } = await resendVerification(email);
    if (!error) toast.success("Verification email sent. Check your inbox.");
    setTimeout(() => setResendCooldown(false), 30_000);
  };
```
4. `handleLogin`: tras `const { error } = await login(email, password);`:
```tsx
    if (error) {
      setUnverifiedEmail(code === "EMAIL_NOT_VERIFIED" ? email : null);
    } else {
      toast.success("Welcome back!");
    }
```
(desestructurar `const { error, code } = await login(email, password);`).
5. `handleSignup`: validar `password.length < 8` con el mensaje `"Password must be at least 8 characters"`; en éxito, `setPendingEmail(email);` en lugar del toast actual.
6. Antes del `return` principal (después del bloque `showForgotPassword`), añadir la vista de verificación pendiente:
```tsx
  if (pendingEmail) {
    return (
      <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-ekana-purple mx-auto mb-2" />
            <CardTitle>Check your inbox</CardTitle>
            <CardDescription>
              We sent a verification link to <strong>{pendingEmail}</strong>. Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline" disabled={resendCooldown} onClick={() => handleResend(pendingEmail)}>
              {resendCooldown ? "Email sent — you can resend in 30s" : "Resend verification email"}
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => setPendingEmail(null)}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
```
7. Dentro del `CardContent` principal, justo después del `Alert` de `authError`, añadir:
```tsx
            {unverifiedEmail && (
              <div className="mb-4 text-center">
                <Button variant="link" className="text-sm" disabled={resendCooldown} onClick={() => handleResend(unverifiedEmail)}>
                  {resendCooldown ? "Verification email sent" : "Resend verification email"}
                </Button>
              </div>
            )}
            {linkError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>This verification link is invalid or has expired. Enter your email to get a new one.</p>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleResend(resendEmail).then(() => setSearchParams({}));
                    }}
                  >
                    <Input type="email" required placeholder="Email" value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} />
                    <Button type="submit" size="sm" disabled={resendCooldown}>Send</Button>
                  </form>
                </AlertDescription>
              </Alert>
            )}
```
8. Input de contraseña del registro: `placeholder="Password (min 8 characters)"` y `minLength={8}`.
9. Nota inferior: reemplazar el texto por `"You'll need to verify your email before signing in."`.

- [ ] **Step 2: `ResetPassword.tsx`**

`apps/web/src/pages/ResetPassword.tsx`:
```tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const MIN_PASSWORD_LENGTH = 8;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset, error: authError, clearError } = useAuth();
  const token = searchParams.get("token");
  const invalidLink = !token || searchParams.get("error") !== null;

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }
    if (password !== confirmation) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    setIsLoading(true);
    const { error } = await confirmPasswordReset(token as string, password);
    setIsLoading(false);
    if (!error) {
      setDone(true);
      toast.success("Password updated. You can sign in now.");
    }
  };

  return (
    <div className="min-h-screen bg-ekana-purple-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{done ? "Password updated" : "Choose a new password"}</CardTitle>
          <CardDescription>
            {invalidLink
              ? "This reset link is invalid or has expired."
              : done
                ? "For your security, you've been signed out of all devices."
                : `Use at least ${MIN_PASSWORD_LENGTH} characters.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invalidLink ? (
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Request a new link
            </Button>
          ) : done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {(formError || authError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError || authError}</AlertDescription>
                </Alert>
              )}
              <Input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
```

- [ ] **Step 3: Ruta**

En `apps/web/src/App.tsx`: `import ResetPassword from './pages/ResetPassword';` y, justo después de `<Route path="/auth" element={<Auth />} />`:
```tsx
                            <Route path="/auth/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 4: Build y commit**

Run: `npm run build:web`
Expected: `✓ built`.

```bash
git add apps/web/src/pages/Auth.tsx apps/web/src/pages/ResetPassword.tsx apps/web/src/App.tsx
git commit -m "feat(web): verificación pendiente, reenvío de correo y restablecer contraseña

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Front — perfiles desde el API

**Files:**
- Create: `apps/web/src/services/userProfile/userProfile.api.ts`
- Modify: `apps/web/src/services/userProfile/index.ts`, `apps/web/src/services/userProfile/types.ts`, `apps/web/src/contexts/UserProfileContext.tsx`, `apps/web/src/hooks/useMockData.ts`, `apps/web/src/lib/utils.ts`, `apps/web/src/components/cards/ConnectCard.tsx`, `apps/web/src/pages/UserProfilePage.tsx`, `apps/web/src/pages/TeamRequest.tsx`, `apps/web/src/services/health/health.service.ts`
- Delete: `apps/web/src/services/userProfile/userProfile.local.ts`, `apps/web/src/services/userProfile/userProfile.supabase.ts`

**Interfaces:**
- Consumes: `/api/v1/profiles`, `/api/v1/profiles/:id`, `/api/v1/me/profile`, tipos de `@ekana/shared`.
- Produces: `userProfileService` (misma interfaz `UserProfileService`) implementado sobre el API; `displayAge(user)` en `@/lib/utils`.

- [ ] **Step 1: Servicio sobre el API**

`apps/web/src/services/userProfile/types.ts`: añadir `age?: number | null;` a `UserProfile` (tras `birthDate`).

`apps/web/src/services/userProfile/userProfile.api.ts`:
```ts
import type { MeResponse, ProfileDto, ProfilesResponse, ProfileUpdate } from '@ekana/shared';
import { api, ApiError } from '@/lib/api';
import type { UserProfile } from './types';

const EDITABLE_KEYS = [
  'name',
  'avatar',
  'bio',
  'location',
  'birthDate',
  'subject',
  'goal',
  'level',
  'weeklyHours',
  'communicationMethods',
  'languages',
  'interests',
  'availability',
  'schedule',
  'activeCourse',
  'profileComplete',
] as const;

function toUserProfile(dto: ProfileDto): UserProfile {
  return { ...dto, activeCourse: dto.activeCourse ?? undefined };
}

// Solo campos editables; los idiomas incompletos del formulario de onboarding se descartan.
function toUpdatePayload(updates: Partial<UserProfile>): ProfileUpdate {
  const payload: Record<string, unknown> = {};
  for (const key of EDITABLE_KEYS) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }
  if (updates.languages) {
    payload.languages = updates.languages.filter((l) => l.language.trim() !== '' && l.proficiency.trim() !== '');
  }
  return payload as ProfileUpdate;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { profiles } = await api.get<ProfilesResponse>('/v1/profiles');
  return profiles.map(toUserProfile);
}

export async function updateProfile(_userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const me = await api.patch<MeResponse>('/v1/me/profile', toUpdatePayload(updates));
  return toUserProfile(me.profile);
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  try {
    return toUserProfile(await api.get<ProfileDto>(`/v1/profiles/${id}`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
```

`apps/web/src/services/userProfile/index.ts` (reemplazar completo):
```ts
import * as apiService from './userProfile.api';

export const userProfileService = apiService;

// Re-export types
export type { UserProfile } from './types';
export { defaultProfile } from './types';
```

Run: `git rm apps/web/src/services/userProfile/userProfile.local.ts apps/web/src/services/userProfile/userProfile.supabase.ts`

- [ ] **Step 2: `UserProfileContext` carga perfiles solo con sesión**

En `apps/web/src/contexts/UserProfileContext.tsx`:
- borrar las dos líneas `console.log('🔍 [Init] ...')` del inicio del módulo;
- reemplazar el `useEffect` de carga por:
```tsx
  // Los perfiles requieren sesión: se cargan al iniciar sesión y se vacían al cerrarla.
  useEffect(() => {
    if (!user?.id) {
      setAllProfiles([]);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    userProfileService
      .fetchAllProfiles()
      .then((profiles) => {
        if (mounted) setAllProfiles(profiles);
      })
      .catch((error) => {
        console.error('Failed to load user profiles:', error);
        toast.error('Failed to load user profiles');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);
```

- [ ] **Step 3: Usuarios reales en `useAllUsers` / `useUser`**

En `apps/web/src/hooks/useMockData.ts`:
- quitar `mockUsers,` del import de `../lib/mockData`;
- añadir `import type { UserProfile } from '../services/userProfile';`;
- añadir antes de `useAllUsers`:
```ts
// Los usuarios salen de los perfiles reales del API (sin datos mock).
const profileToUser = (profile: UserProfile): User => ({
  id: profile.id,
  email: '',
  name: profile.name || 'User',
  avatar: profile.avatar || undefined,
  isPremium: Boolean(profile.isPremium),
  profileComplete: Boolean(profile.profileComplete),
  hasActiveTeam: Boolean(profile.hasActiveTeam),
  activeCourse: profile.activeCourse,
  bio: profile.bio,
  location: profile.location,
  birthDate: profile.birthDate ?? undefined,
  age: profile.age ?? null,
  subject: profile.subject,
  goal: profile.goal as User['goal'],
  level: profile.level,
  weeklyHours: profile.weeklyHours,
  communicationMethods: profile.communicationMethods,
  languages: profile.languages,
  interests: profile.interests,
  availability: profile.availability,
  schedule: profile.schedule,
});
```
- reemplazar el cuerpo completo de `useAllUsers` por:
```ts
export const useAllUsers = (): User[] => {
  const { getAllVisibleProfiles } = useUserProfile();
  return useMemo(() => getAllVisibleProfiles().map(profileToUser), [getAllVisibleProfiles]);
};
```
- reemplazar el cuerpo completo de `useUser` por:
```ts
export const useUser = (userId: string): User | null => {
  const { getUserProfile } = useUserProfile();
  const profile = getUserProfile(userId);
  return profile ? profileToUser(profile) : null;
};
```
(y eliminar los comentarios "Merges User identity (from mockUsers)..." que quedan obsoletos).

- [ ] **Step 4: Edad sin exponer la fecha de nacimiento**

En `apps/web/src/lib/utils.ts`, después de `calculateAge`, añadir:
```ts
// Otros usuarios traen `age` calculada por el API; el propio usuario trae su fecha de nacimiento.
export function displayAge(user?: { age?: number | null; birthDate?: { day: string; month: string; year: string } } | null): number | null {
  if (!user) return null;
  if (user.age !== undefined && user.age !== null) return user.age;
  return user.birthDate ? calculateAge(user.birthDate) : null;
}
```
Reemplazos:
- `ConnectCard.tsx`: `import { calculateAge } from "@/lib/utils";` → `import { displayAge } from "@/lib/utils";` y `const age = user?.birthDate ? calculateAge(user.birthDate) : null;` → `const age = displayAge(user);`
- `UserProfilePage.tsx`: `import { calculateAge, findCommonRoadmaps } from '@/lib/utils';` → `import { displayAge, findCommonRoadmaps } from '@/lib/utils';` y `const age = profileUser.birthDate ? calculateAge(profileUser.birthDate) : null;` → `const age = displayAge(profileUser);`
- `TeamRequest.tsx`: `import { calculateAge } from "@/lib/utils";` → `import { displayAge } from "@/lib/utils";`; las tres expresiones `{currentUser?.birthDate && \`, ${calculateAge(currentUser.birthDate)}\`}` → `{displayAge(currentUser) !== null && \`, ${displayAge(currentUser)}\`}` y `{receiverUser?.birthDate && \`, ${calculateAge(receiverUser.birthDate)}\`}` → `{displayAge(receiverUser) !== null && \`, ${displayAge(receiverUser)}\`}`.

- [ ] **Step 5: Health check de auth**

En `apps/web/src/services/health/health.service.ts`:
- quitar `import { supabase } from '@/integrations/supabase/client';`;
- actualizar el comentario de cabecera `Follows the same pattern as userProfile.supabase.ts` → `Checks go through the Ekana API.`;
- reemplazar el cuerpo de `checkAuth` por:
```ts
export async function checkAuth(): Promise<HealthStatus> {
  return safeAsyncCheck(async () => {
    await api.get('/auth/ok');
  });
}
```
y su JSDoc por `Checks the auth service through the Ekana API (/api/auth/ok).`.

- [ ] **Step 6: Build, búsqueda de restos y commit**

Run: `npm run build:web`
Expected: `✓ built`.

Run: `grep -rn "userProfile.supabase\|userProfile.local\|supabase.auth" apps/web/src`
Expected: solo `lib/supabaseHealth.ts` y `services/teams/teams.supabase.ts` (dominios de fases posteriores).

```bash
git add -A apps/web/src
git commit -m "feat(web): perfiles desde el API, usuarios reales en Connect y edad sin fecha de nacimiento

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Variables, prueba E2E, integración y despliegue

**Files:** ninguno de código (salvo correcciones que salgan de la prueba).

- [ ] **Step 1: Variables locales**

Confirmar que `apps/api/.env` tiene `APP_URL=http://localhost:8080`, `BETTER_AUTH_SECRET` (≥ 32 caracteres), `AUTH_RATE_LIMIT_MAX`, `SMTP_*` y `EMAIL_FROM`. `SMTP_PASS` (contraseña de aplicación de Gmail) la pega el usuario. No imprimir valores.

- [ ] **Step 2: E2E local con correos en consola**

Arrancar el API con SMTP desactivado solo para esta prueba (`SMTP_HOST= npm run dev:api` en segundo plano; los enlaces salen en el log) y `npm run dev:web`. En el navegador (`http://localhost:8080`):
1. Registro → vista "Check your inbox" → abrir el enlace del log → llega a `/onboarding` con sesión.
2. Completar onboarding → `/dashboard`.
3. `/profile`: editar identidad (nombre, fecha de nacimiento), información básica e intereses → recargar la página → los cambios persisten.
4. Logout → login con la misma cuenta → `/dashboard`.
5. "Forgot Password?" → enlace del log → `/auth/reset-password` → nueva contraseña → login con la nueva.
6. Crear una segunda cuenta verificada → en `/connect` aparece la primera cuenta con edad y sin email; `/profile/<id>` muestra su perfil público.
7. Login sin verificar una tercera cuenta → mensaje de verificación y botón de reenvío.
Expected: todo funciona; en consola del navegador no hay errores de auth/perfiles (sí puede haber errores de dominios aún en Supabase).

- [ ] **Step 3: Prueba con correo real**

Arrancar el API con el SMTP de `.env` y pedir al usuario que se registre con su email real: confirmar que llega el correo (remitente, asunto en inglés, botón) y que el enlace funciona.

- [ ] **Step 4: Variables en Railway (las pone el usuario)**

En `@ekana/api` → Variables: `APP_URL=https://ekana-web.vercel.app`, `BETTER_AUTH_SECRET=<nuevo, generado por el usuario>`, `AUTH_RATE_LIMIT_MAX=20`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, `SMTP_USER=inti.solutions.developer@gmail.com`, `SMTP_PASS=<contraseña de aplicación>`, `EMAIL_FROM=Ekana <ekana@ekana.com.co>`. Deben existir **antes** del merge: sin ellas la validación de configuración impide arrancar.

- [ ] **Step 5: PR, CI y merge**

Push de la rama y PR a `main` (el usuario lo abre desde el enlace de GitHub). CI en verde → merge.

- [ ] **Step 6: Verificación en producción**

Run: `curl -s https://ekana-web.vercel.app/api/auth/ok` → `{"ok":true}`; `curl -s -o /dev/null -w "%{http_code}" https://ekana-web.vercel.app/api/v1/me` → `401`.
El usuario se registra en `https://ekana-web.vercel.app` con su email real, verifica, completa el onboarding y edita su perfil.
Expected: flujo completo en producción; la cookie de sesión es `__Secure-…` (HTTPS).
