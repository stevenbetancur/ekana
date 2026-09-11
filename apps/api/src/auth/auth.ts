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
    advanced: {
      database: { generateId: 'uuid' },
      // Better Auth desactiva la verificación de origen/CSRF cuando NODE_ENV=test; la forzamos
      // en todos los entornos para que la protección no dependa de una variable de entorno.
      disableOriginCheck: false,
    },
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
