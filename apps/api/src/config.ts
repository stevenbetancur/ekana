import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');
const csv = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const envSchema = z.object({
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

export type Config = {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  logLevel: string;
  corsOrigins: string[];
  rateLimitMax: number;
  db: DbConfig;
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
  };
}
