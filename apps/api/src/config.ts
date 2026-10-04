import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
const csv = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
// dotenv convierte `SMTP_PASS=` en '': lo tratamos como "no definido".
const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional());
const urlWithoutTrailingSlash = z
  .string()
  .url()
  .transform((value) => value.replace(/\/+$/, ''));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('::'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    CORS_ORIGINS: csv.default('http://localhost:8080'),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_SSL: booleanString.default('true'),
    DB_POOL_SIZE: z.coerce.number().int().positive().default(10),
    APP_URL: urlWithoutTrailingSlash.default('http://localhost:8080'),
    BETTER_AUTH_SECRET: z.string().min(32, 'debe tener al menos 32 caracteres'),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: booleanString.default('false'),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: z.string().min(1).default('Ekana <no-reply@localhost>'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    // En producción hace falta un transporte real: Resend (API HTTPS) o SMTP completo.
    const smtpCompleto = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    if (!env.RESEND_API_KEY && !smtpCompleto) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RESEND_API_KEY'],
        message: 'obligatorio en producción (o SMTP_HOST + SMTP_USER + SMTP_PASS)',
      });
    }
  });

export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  poolSize: number;
};

export type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };

export type Config = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  logLevel: string;
  corsOrigins: string[];
  rateLimitMax: number;
  db: DbConfig;
  appUrl: string;
  auth: { secret: string; rateLimitMax: number };
  smtp: SmtpConfig | null;
  resendApiKey: string | null;
  emailFrom: string;
};

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new ConfigError(`Configuración inválida: ${problems}`);
  }
  const e = parsed.data;
  return {
    nodeEnv: e.NODE_ENV,
    host: e.HOST,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    corsOrigins: e.CORS_ORIGINS,
    rateLimitMax: e.RATE_LIMIT_MAX,
    db: {
      host: e.DB_HOST,
      port: e.DB_PORT,
      user: e.DB_USER,
      password: e.DB_PASSWORD,
      database: e.DB_NAME,
      ssl: e.DB_SSL,
      poolSize: e.DB_POOL_SIZE,
    },
    appUrl: e.APP_URL,
    auth: { secret: e.BETTER_AUTH_SECRET, rateLimitMax: e.AUTH_RATE_LIMIT_MAX },
    smtp:
      e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS
        ? { host: e.SMTP_HOST, port: e.SMTP_PORT, secure: e.SMTP_SECURE, user: e.SMTP_USER, pass: e.SMTP_PASS }
        : null,
    resendApiKey: e.RESEND_API_KEY ?? null,
    emailFrom: e.EMAIL_FROM,
  };
}
