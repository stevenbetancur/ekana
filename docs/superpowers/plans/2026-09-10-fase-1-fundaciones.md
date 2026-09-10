# Fase 1 — Fundaciones: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo `ekana` con API Fastify conectado a MySQL (RDS), esquema completo de 22 tablas con migraciones versionadas y testeadas, front actual copiado y funcionando contra el API vía proxy, CI y primer despliegue en Railway (API) y Vercel (front).

**Architecture:** npm workspaces con `packages/shared` (zod: enums, contrato de errores y health), `apps/api` (Fastify 5 + Drizzle ORM + mysql2) y `apps/web` (el front Vite actual). El API sirve todo bajo `/api`. En producción Vercel reescribe `/api/*` hacia Railway, así el navegador ve un solo origen.

**Tech Stack:** Node 24 LTS, TypeScript 5.9.3, Fastify 5.12.3, Drizzle ORM 0.45.2 + drizzle-kit 0.31.10, mysql2 3.24.4 + aws-ssl-profiles 1.1.2, zod 3.25.76, Vitest 4.1.11, tsx 4.23.13, React 18 + Vite 5 (front existente).

**Spec:** `docs/superpowers/specs/2026-09-10-ekana-mysql-migration-design.md`

## Global Constraints

- Node 24 LTS (`"engines": { "node": "24.x" }` en la raíz y `.nvmrc` = `24`, para que Railway no elija una versión no LTS). Gestor: npm (workspaces). Nunca bun/pnpm/yarn.
- Versiones exactas (sin `^`) para dependencias nuevas: `fastify@5.12.3`, `@fastify/helmet@13.1.1`, `@fastify/cors@11.3.0`, `@fastify/rate-limit@11.2.0`, `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, `mysql2@3.24.4`, `aws-ssl-profiles@1.1.2`, `zod@3.25.76`, `dotenv@17.4.2`, `vitest@4.1.11`, `tsx@4.23.13`, `typescript@5.9.3`, `pino-pretty@13.1.3`, `@types/node@24`.
- Todas las rutas del API cuelgan de `/api` (`/api/health`, `/api/health/db`; más adelante `/api/v1/...` y `/api/auth/*`).
- Formato único de error: `{ "error": { "code": string, "message": string, "details"?: unknown } }`. Mensajes visibles al usuario en español; código e identificadores en inglés.
- BD: MySQL 8.0.45 en `inti.cmso5z249brn.us-east-1.rds.amazonaws.com`, usuario `admin`, SSL con `aws-ssl-profiles`. Desarrollo = `ekana`, tests = `ekana_test` (lo crea el setup de tests), producción = `ekana_prod` (fase 7, no en esta fase). Railway usa `ekana` durante esta fase.
- Los tests solo pueden correr contra una BD cuyo nombre termine en `_test` (guardia obligatoria).
- Charset/collation: `utf8mb4` / `utf8mb4_0900_ai_ci`. Sesión MySQL en modo estricto (`STRICT_TRANS_TABLES`), porque RDS no lo activa por defecto.
- IDs `CHAR(36)` con `crypto.randomUUID()`; fechas `DATETIME(3)` en UTC (`timezone: 'Z'`) con defaults puestos por Drizzle (`$defaultFn` / `$onUpdate`); columnas camelCase en TS y snake_case en BD (`casing: 'snake_case'`).
- TypeScript estricto en `apps/api` y `packages/shared`. `apps/web` conserva su `tsconfig` actual (no estricto).
- Secretos solo en `apps/api/.env` (ignorado por git), en variables de Railway/Vercel o en secrets de GitHub. Nunca en commits, logs ni en el chat.
- Todos los comandos se ejecutan desde `C:\proyectos\ekana` en Git Bash, salvo que el paso diga otra cosa.
- Cada commit termina con la línea `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## Prerrequisitos (los hace el usuario, antes de la Tarea 2)

1. Instalar **Node 24 LTS** (hoy la máquina tiene 20.13.1, que ya no tiene soporte). Verificar con `node --version` → `v24.x`.
2. Tener a mano la contraseña del usuario `admin` del RDS para pegarla en `apps/api/.env` cuando la Tarea 3 lo pida.

## Estructura de archivos resultante

```
ekana/
├── package.json                  # workspaces + scripts orquestadores
├── tsconfig.base.json            # opciones TS estrictas compartidas
├── .nvmrc                        # 24
├── railway.json                  # build/deploy del API en Railway
├── README.md
├── .github/workflows/ci.yml
├── packages/shared/
│   ├── package.json, tsconfig.json
│   └── src/{index.ts, enums.ts, errors.ts, health.ts}
├── apps/api/
│   ├── package.json, tsconfig.json, tsconfig.build.json
│   ├── vitest.config.ts, drizzle.config.ts, .env.example
│   ├── drizzle/                  # migraciones SQL generadas (versionadas)
│   ├── src/
│   │   ├── server.ts             # entrypoint (listen + apagado ordenado)
│   │   ├── app.ts                # buildApp(): plugins, errores, rutas
│   │   ├── config.ts             # variables de entorno validadas con zod
│   │   ├── lib/{errors.ts, error-handler.ts}
│   │   ├── modules/health/routes.ts
│   │   └── db/
│   │       ├── connection.ts     # pool mysql2 (SSL RDS, UTC, modo estricto) + ping
│   │       ├── database.ts       # crear/ajustar BD + guardia *_test
│   │       ├── client.ts         # createDb() (Drizzle)
│   │       ├── migrations.ts     # runMigrations()
│   │       ├── migrate.ts        # CLI: aplicar migraciones
│   │       ├── setup.ts          # CLI: crear/ajustar charset de la BD
│   │       └── schema/{columns,auth,profiles,teams,roadmaps,progress,communication,gamification,system,index}.ts
│   └── test/
│       ├── global-setup.ts
│       ├── helpers/{config.ts, db.ts, factories.ts}
│       ├── config.test.ts, app.test.ts, db.test.ts, security.test.ts
│       └── schema/{users-teams,roadmaps-progress,communication}.test.ts
└── apps/web/                     # copia del front de ekana-team-up-now
    ├── vercel.json
    └── src/lib/api.ts            # cliente HTTP del API
```

---

### Task 1: Monorepo raíz y paquete `@ekana/shared`

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.nvmrc`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`
- Create: `packages/shared/src/enums.ts`, `packages/shared/src/errors.ts`, `packages/shared/src/health.ts`, `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: nada.
- Produces (importable como `@ekana/shared`):
  - `USER_ROLES`, `NOTIFICATION_TYPES`, `NOTIFICATION_LEVELS`, `ROADMAP_OWNER_TYPES`, `REQUEST_TYPES`, `REQUEST_STATUSES` (tuplas `as const`) y sus tipos `UserRole`, `NotificationType`, `NotificationLevel`, `RoadmapOwnerType`, `RequestType`, `RequestStatus`.
  - `ERROR_CODES` (objeto `as const`), tipo `ErrorCode`, `errorResponseSchema`, tipo `ErrorResponse`.
  - `healthResponseSchema` (`{ status: 'ok', uptimeSeconds: number, timestamp: string }`), `dbHealthResponseSchema` (`{ status: 'ok', latencyMs: number }`) y sus tipos `HealthResponse`, `DbHealthResponse`.

- [ ] **Step 1: Crear la raíz del monorepo**

`package.json`:
```json
{
  "name": "ekana",
  "private": true,
  "type": "module",
  "engines": {
    "node": "24.x"
  },
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build:shared": "npm run build -w @ekana/shared",
    "build:api": "npm run build:shared && npm run build -w @ekana/api",
    "build:web": "npm run build -w @ekana/web",
    "build": "npm run build:api && npm run build:web",
    "dev:api": "npm run build:shared && npm run dev -w @ekana/api",
    "dev:web": "npm run dev -w @ekana/web",
    "typecheck": "npm run build:shared && npm run typecheck -w @ekana/api",
    "test": "npm run build:shared && npm run test -w @ekana/api",
    "db:setup": "npm run db:setup -w @ekana/api",
    "db:generate": "npm run build:shared && npm run db:generate -w @ekana/api",
    "db:migrate": "npm run build:shared && npm run db:migrate:dev -w @ekana/api"
  }
}
```
(Los scripts de `api` y `web` empiezan a funcionar cuando existan esos paquetes, en las Tareas 2 y 8.)

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

`.nvmrc`:
```
24
```

- [ ] **Step 2: Crear `packages/shared`**

`packages/shared/package.json`:
```json
{
  "name": "@ekana/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "3.25.76"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/shared/src/enums.ts`:
```ts
export const USER_ROLES = ['admin', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const NOTIFICATION_TYPES = [
  'TEAM_INVITE',
  'NEW_MESSAGE',
  'GOAL_COMPLETED',
  'BADGE_EARNED',
  'POINTS_EARNED',
  'HANDLER_TRIGGERED',
  'BEST_RESPONSE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_LEVELS = ['info', 'success', 'warning', 'error'] as const;
export type NotificationLevel = (typeof NOTIFICATION_LEVELS)[number];

export const ROADMAP_OWNER_TYPES = ['USER', 'TEAM', 'THIRD_PARTY'] as const;
export type RoadmapOwnerType = (typeof ROADMAP_OWNER_TYPES)[number];

export const REQUEST_TYPES = ['CREATE_TEAM', 'INVITE_TO_TEAM', 'REQUEST_TO_JOIN'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
```

`packages/shared/src/errors.ts`:
```ts
import { z } from 'zod';

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  DB_UNAVAILABLE: 'DB_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
```

`packages/shared/src/health.ts`:
```ts
import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const dbHealthResponseSchema = z.object({
  status: z.literal('ok'),
  latencyMs: z.number(),
});
export type DbHealthResponse = z.infer<typeof dbHealthResponseSchema>;
```

`packages/shared/src/index.ts`:
```ts
export * from './enums.js';
export * from './errors.js';
export * from './health.js';
```

- [ ] **Step 3: Instalar y compilar**

Run: `npm install && npm run build:shared && ls packages/shared/dist`
Expected: instala sin errores y lista `enums.js enums.d.ts errors.js ... index.js index.d.ts`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json .nvmrc packages/shared
git commit -m "chore: monorepo npm workspaces y paquete @ekana/shared

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: API base: configuración, manejo de errores y `GET /api/health`

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/tsconfig.build.json`, `apps/api/vitest.config.ts`, `apps/api/.env.example`
- Create: `apps/api/src/config.ts`, `apps/api/src/lib/errors.ts`, `apps/api/src/lib/error-handler.ts`, `apps/api/src/modules/health/routes.ts`, `apps/api/src/app.ts`
- Test: `apps/api/test/helpers/config.ts`, `apps/api/test/config.test.ts`, `apps/api/test/app.test.ts`

**Interfaces:**
- Consumes: `ERROR_CODES`, `ErrorResponse`, `healthResponseSchema` de `@ekana/shared`.
- Produces:
  - `loadConfig(env?: NodeJS.ProcessEnv): Config`; `class ConfigError extends Error`.
  - `type Config = { nodeEnv: 'development' | 'test' | 'production'; host: string; port: number; logLevel: string; corsOrigins: string[]; rateLimitMax: number; db: DbConfig }`.
  - `type DbConfig = { host: string; port: number; user: string; password: string; database: string; ssl: boolean; poolSize: number }`.
  - `class AppError extends Error { statusCode: number; code: string; details?: unknown }` y los helpers `notFound(message?)`, `forbidden(message?)`, `unauthenticated(message?)`, `conflict(message)`.
  - `registerErrorHandling(app: FastifyInstance): void`.
  - `buildApp(deps: AppDeps): FastifyInstance`, con `AppDeps = { config: Config }` (la Tarea 3 añade `pool`).
  - Helper de test `makeTestConfig(overrides?: Record<string, string>): Config`.

- [ ] **Step 1: Crear el paquete `apps/api`**

`apps/api/package.json`:
```json
{
  "name": "@ekana/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/server.js",
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:setup": "tsx src/db/setup.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate:dev": "tsx src/db/migrate.ts",
    "db:migrate": "node dist/db/migrate.js"
  },
  "dependencies": {
    "@ekana/shared": "*",
    "@fastify/cors": "11.3.0",
    "@fastify/helmet": "13.1.1",
    "@fastify/rate-limit": "11.2.0",
    "aws-ssl-profiles": "1.1.2",
    "dotenv": "17.4.2",
    "drizzle-orm": "0.45.2",
    "fastify": "5.12.3",
    "mysql2": "3.24.4",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@types/node": "24",
    "drizzle-kit": "0.31.10",
    "pino-pretty": "13.1.3",
    "tsx": "4.23.13",
    "typescript": "5.9.3",
    "vitest": "4.1.11"
  }
}
```

`apps/api/tsconfig.json` (typecheck de todo, incluidos los tests):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "test", "vitest.config.ts", "drizzle.config.ts"]
}
```

`apps/api/tsconfig.build.json` (solo `src`, emite `dist`):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`apps/api/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
  },
});
```

`apps/api/.env.example`:
```
NODE_ENV=development
HOST=::
PORT=3000
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:8080
RATE_LIMIT_MAX=300

DB_HOST=inti.cmso5z249brn.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=
DB_NAME=ekana
DB_SSL=true
DB_POOL_SIZE=10
```

Run: `npm install`
Expected: instala las dependencias del API sin errores.

- [ ] **Step 2: Escribir el test de configuración (falla)**

`apps/api/test/helpers/config.ts`:
```ts
import { loadConfig, type Config } from '../../src/config.js';

export function makeTestConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    DB_HOST: '127.0.0.1',
    DB_USER: 'test',
    DB_PASSWORD: 'test',
    DB_NAME: 'unit_test',
    DB_SSL: 'false',
    ...overrides,
  });
}
```

`apps/api/test/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadConfig, ConfigError } from '../src/config.js';

const base = { DB_HOST: 'db.local', DB_USER: 'u', DB_PASSWORD: 'p', DB_NAME: 'ekana' };

describe('loadConfig', () => {
  it('aplica valores por defecto', () => {
    const config = loadConfig(base);
    expect(config.nodeEnv).toBe('development');
    expect(config.port).toBe(3000);
    expect(config.host).toBe('::');
    expect(config.corsOrigins).toEqual(['http://localhost:8080']);
    expect(config.rateLimitMax).toBe(300);
    expect(config.db).toEqual({
      host: 'db.local',
      port: 3306,
      user: 'u',
      password: 'p',
      database: 'ekana',
      ssl: true,
      poolSize: 10,
    });
  });

  it('convierte tipos desde strings', () => {
    const config = loadConfig({
      ...base,
      PORT: '8081',
      DB_SSL: 'false',
      CORS_ORIGINS: 'https://a.com, https://b.com',
    });
    expect(config.port).toBe(8081);
    expect(config.db.ssl).toBe(false);
    expect(config.corsOrigins).toEqual(['https://a.com', 'https://b.com']);
  });

  it('falla indicando las variables que faltan', () => {
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(ConfigError);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_HOST/);
    expect(() => loadConfig({ DB_USER: 'u' })).toThrow(/DB_PASSWORD/);
  });

  it('rechaza un puerto inválido', () => {
    expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/);
  });
});
```

Run: `npm run build:shared && npm test -w @ekana/api -- test/config.test.ts`
Expected: FAIL, porque `../src/config.js` no existe.

- [ ] **Step 3: Implementar `config.ts`**

`apps/api/src/config.ts`:
```ts
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
```

Run: `npm test -w @ekana/api -- test/config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Escribir el test de la app (falla)**

`apps/api/test/app.test.ts`:
```ts
import { describe, it, expect, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { healthResponseSchema, errorResponseSchema } from '@ekana/shared';
import { buildApp } from '../src/app.js';
import { AppError } from '../src/lib/errors.js';
import { makeTestConfig } from './helpers/config.js';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

function createApp(): FastifyInstance {
  app = buildApp({ config: makeTestConfig() });
  return app;
}

describe('app', () => {
  it('GET /api/health responde ok', async () => {
    const res = await createApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    const body = healthResponseSchema.parse(res.json());
    expect(body.status).toBe('ok');
  });

  it('una ruta inexistente responde 404 ROUTE_NOT_FOUND', async () => {
    const res = await createApp().inject({ method: 'GET', url: '/api/no-existe' });
    expect(res.statusCode).toBe(404);
    expect(errorResponseSchema.parse(res.json()).error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('un AppError responde con su status, código y mensaje', async () => {
    const instance = createApp();
    instance.get('/api/__conflict', async () => {
      throw new AppError(409, 'CONFLICT', 'Ya existe');
    });
    const res = await instance.inject({ method: 'GET', url: '/api/__conflict' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: { code: 'CONFLICT', message: 'Ya existe' } });
  });

  it('un ZodError responde 400 VALIDATION_ERROR con detalles', async () => {
    const instance = createApp();
    instance.post('/api/__validate', async (request) => z.object({ name: z.string() }).parse(request.body));
    const res = await instance.inject({ method: 'POST', url: '/api/__validate', payload: {} });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details[0].path).toBe('name');
  });

  it('un JSON mal formado responde 400 BAD_REQUEST', async () => {
    const instance = createApp();
    instance.post('/api/__echo', async (request) => request.body);
    const res = await instance.inject({
      method: 'POST',
      url: '/api/__echo',
      headers: { 'content-type': 'application/json' },
      payload: '{mal',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('BAD_REQUEST');
  });

  it('un error inesperado responde 500 sin filtrar el mensaje interno', async () => {
    const instance = createApp();
    instance.get('/api/__boom', async () => {
      throw new Error('detalle secreto');
    });
    const res = await instance.inject({ method: 'GET', url: '/api/__boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
    expect(res.body).not.toContain('secreto');
  });
});
```

Run: `npm test -w @ekana/api -- test/app.test.ts`
Expected: FAIL, porque `../src/app.js` no existe.

- [ ] **Step 5: Implementar errores, manejador, health y `buildApp`**

`apps/api/src/lib/errors.ts`:
```ts
import { ERROR_CODES } from '@ekana/shared';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = 'Recurso no encontrado') =>
  new AppError(404, ERROR_CODES.NOT_FOUND, message);

export const forbidden = (message = 'No tienes permiso para esta acción') =>
  new AppError(403, ERROR_CODES.FORBIDDEN, message);

export const unauthenticated = (message = 'Debes iniciar sesión') =>
  new AppError(401, ERROR_CODES.UNAUTHENTICATED, message);

export const conflict = (message: string) => new AppError(409, ERROR_CODES.CONFLICT, message);
```

`apps/api/src/lib/error-handler.ts`:
```ts
import type { FastifyInstance } from 'fastify';
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

export function registerErrorHandling(app: FastifyInstance): void {
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
    reply
      .status(404)
      .send(errorBody(ERROR_CODES.ROUTE_NOT_FOUND, `Ruta no encontrada: ${request.method} ${request.url}`));
  });
}
```

`apps/api/src/modules/health/routes.ts`:
```ts
import type { FastifyPluginAsync } from 'fastify';
import type { HealthResponse } from '@ekana/shared';

export function healthRoutes(): FastifyPluginAsync {
  return async (app) => {
    app.get('/health', async (): Promise<HealthResponse> => ({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }));
  };
}
```

`apps/api/src/app.ts`:
```ts
import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { registerErrorHandling } from './lib/error-handler.js';
import { healthRoutes } from './modules/health/routes.js';

export interface AppDeps {
  config: Config;
}

export function buildApp({ config }: AppDeps): FastifyInstance {
  const app = Fastify({
    logger:
      config.nodeEnv === 'test'
        ? false
        : {
            level: config.logLevel,
            redact: ['req.headers.cookie', 'req.headers.authorization'],
            transport: config.nodeEnv === 'development' ? { target: 'pino-pretty' } : undefined,
          },
    genReqId: () => randomUUID(),
    trustProxy: true,
  });

  registerErrorHandling(app);
  app.register(healthRoutes(), { prefix: '/api' });

  return app;
}
```

- [ ] **Step 6: Correr los tests**

Run: `npm test -w @ekana/api`
Expected: PASS (10 tests en `config.test.ts` y `app.test.ts`).

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add apps/api package-lock.json
git commit -m "feat(api): configuración validada, formato de errores y GET /api/health

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Conexión a MySQL, preparación de la BD y `GET /api/health/db`

**Files:**
- Create: `apps/api/src/db/connection.ts`, `apps/api/src/db/database.ts`, `apps/api/src/db/setup.ts`
- Create: `apps/api/test/global-setup.ts`, `apps/api/test/db.test.ts`
- Modify: `apps/api/vitest.config.ts`, `apps/api/src/app.ts`, `apps/api/src/modules/health/routes.ts`, `apps/api/test/app.test.ts`, `apps/api/test/helpers/config.ts`
- Local (no se versiona): `apps/api/.env`

**Interfaces:**
- Consumes: `loadConfig`, `DbConfig`, `AppError`, `ERROR_CODES`.
- Produces:
  - `createPool(db: DbConfig, extra?: PoolOptions): Pool` (mysql2/promise; SSL con aws-ssl-profiles si `db.ssl`, `timezone: 'Z'`, sesión en modo estricto).
  - `connectionOptions(db: DbConfig): ConnectionOptions` (sin `database`).
  - `pingDatabase(pool: Pool): Promise<number>` (latencia en ms).
  - `ensureDatabase(db: DbConfig): Promise<void>` (crea la BD si falta y fija `utf8mb4_0900_ai_ci`).
  - `assertTestDatabaseName(name: string): void`.
  - `buildApp(deps)` pasa a `AppDeps = { config: Config; pool: Pool }`.
  - Helper de test `loadTestConfig(): Config` (lee `process.env` y aplica la guardia `_test`).

- [ ] **Step 1: Crear `apps/api/.env` (lo completa el usuario)**

Run: `cp apps/api/.env.example apps/api/.env && git check-ignore apps/api/.env`
Expected: imprime `apps/api/.env`, lo que confirma que git lo ignora.

**Pedir al usuario** que abra `apps/api/.env` y pegue la contraseña de `admin` en `DB_PASSWORD=`. No continuar hasta que confirme. No leer ni imprimir ese valor.

- [ ] **Step 2: Escribir los tests de BD (fallan)**

`apps/api/test/helpers/config.ts` (reemplazar completo):
```ts
import { loadConfig, type Config } from '../../src/config.js';
import { assertTestDatabaseName } from '../../src/db/database.js';

// Config sintética para tests que no tocan la BD (el pool de mysql2 no conecta hasta la primera query).
export function makeTestConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    DB_HOST: '127.0.0.1',
    DB_USER: 'test',
    DB_PASSWORD: 'test',
    DB_NAME: 'unit_test',
    DB_SSL: 'false',
    ...overrides,
  });
}

// Config real (apps/api/.env + DB_NAME forzado a *_test por vitest.config.ts).
export function loadTestConfig(): Config {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  return config;
}
```

`apps/api/test/db.test.ts`:
```ts
import { describe, it, expect, afterAll } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { dbHealthResponseSchema } from '@ekana/shared';
import { createPool, pingDatabase } from '../src/db/connection.js';
import { assertTestDatabaseName } from '../src/db/database.js';
import { buildApp } from '../src/app.js';
import { loadTestConfig } from './helpers/config.js';

const config = loadTestConfig();
const pool = createPool(config.db);

afterAll(async () => {
  await pool.end();
});

describe('conexión MySQL', () => {
  it('hace ping a la BD de tests', async () => {
    const latency = await pingDatabase(pool);
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('usa modo estricto en la sesión', async () => {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT @@SESSION.sql_mode AS mode');
    expect(rows[0]?.mode).toContain('STRICT_TRANS_TABLES');
  });

  it('la BD de tests usa utf8mb4_0900_ai_ci', async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT default_collation_name AS c FROM information_schema.schemata WHERE schema_name = DATABASE()',
    );
    expect(rows[0]?.c).toBe('utf8mb4_0900_ai_ci');
  });
});

describe('guardia de BD de tests', () => {
  it('rechaza nombres que no terminan en _test', () => {
    expect(() => assertTestDatabaseName('ekana')).toThrow(/_test/);
    expect(() => assertTestDatabaseName('ekana_test')).not.toThrow();
  });
});

describe('GET /api/health/db', () => {
  it('responde ok con la latencia cuando la BD responde', async () => {
    const app = buildApp({ config, pool });
    const res = await app.inject({ method: 'GET', url: '/api/health/db' });
    await app.close();
    expect(res.statusCode).toBe(200);
    expect(dbHealthResponseSchema.parse(res.json()).status).toBe('ok');
  });

  it('responde 503 DB_UNAVAILABLE cuando la BD no responde', async () => {
    const deadPool = createPool({ ...config.db, host: '127.0.0.1', port: 1, ssl: false }, { connectTimeout: 2000 });
    const app = buildApp({ config, pool: deadPool });
    const res = await app.inject({ method: 'GET', url: '/api/health/db' });
    await app.close();
    await deadPool.end();
    expect(res.statusCode).toBe(503);
    expect(res.json().error.code).toBe('DB_UNAVAILABLE');
  });
});
```

`apps/api/test/global-setup.ts`:
```ts
import { loadConfig } from '../src/config.js';
import { assertTestDatabaseName, ensureDatabase } from '../src/db/database.js';

export default async function setup(): Promise<void> {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  await ensureDatabase(config.db);
}
```

`apps/api/vitest.config.ts` (reemplazar completo):
```ts
import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Los tests nunca tocan la BD de desarrollo: forzamos la BD *_test.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_TEST_NAME ?? 'ekana_test';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    globalSetup: ['test/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
```

Run: `npm test -w @ekana/api -- test/db.test.ts`
Expected: FAIL, porque `../src/db/connection.js` no existe.

- [ ] **Step 3: Implementar conexión y preparación de BD**

`apps/api/src/db/connection.ts`:
```ts
import mysql, { type ConnectionOptions, type Pool, type PoolOptions } from 'mysql2/promise';
import awsCaBundle from 'aws-ssl-profiles';
import type { DbConfig } from '../config.js';

// RDS no activa el modo estricto por defecto: sin él MySQL trunca datos en silencio.
const STRICT_SQL_MODE =
  'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

export function connectionOptions(db: DbConfig): ConnectionOptions {
  return {
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    ssl: db.ssl ? awsCaBundle : undefined,
    timezone: 'Z',
  };
}

export function createPool(db: DbConfig, extra: PoolOptions = {}): Pool {
  const pool = mysql.createPool({
    ...connectionOptions(db),
    database: db.database,
    connectionLimit: db.poolSize,
    waitForConnections: true,
    enableKeepAlive: true,
    ...extra,
  });
  pool.pool.on('connection', (connection) => {
    connection.query(`SET SESSION sql_mode = '${STRICT_SQL_MODE}'`, (error) => {
      if (error) console.error('No se pudo fijar sql_mode estricto', error);
    });
  });
  return pool;
}

export async function pingDatabase(pool: Pool): Promise<number> {
  const started = performance.now();
  await pool.query('SELECT 1');
  return Math.round(performance.now() - started);
}
```

`apps/api/src/db/database.ts`:
```ts
import mysql from 'mysql2/promise';
import type { DbConfig } from '../config.js';
import { connectionOptions } from './connection.js';

const SAFE_DATABASE_NAME = /^[A-Za-z0-9_]+$/;

export function assertTestDatabaseName(name: string): void {
  if (!name.endsWith('_test')) {
    throw new Error(`Por seguridad los tests solo corren contra una BD *_test (recibido: "${name}")`);
  }
}

export async function ensureDatabase(db: DbConfig): Promise<void> {
  if (!SAFE_DATABASE_NAME.test(db.database)) {
    throw new Error(`Nombre de BD inválido: "${db.database}"`);
  }
  const connection = await mysql.createConnection(connectionOptions(db));
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`,
    );
    await connection.query(`ALTER DATABASE \`${db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
  } finally {
    await connection.end();
  }
}
```

`apps/api/src/db/setup.ts`:
```ts
import 'dotenv/config';
import { loadConfig } from '../config.js';
import { ensureDatabase } from './database.js';

const config = loadConfig();
await ensureDatabase(config.db);
console.log(`BD "${config.db.database}" lista (utf8mb4_0900_ai_ci)`);
```

- [ ] **Step 4: Añadir `/api/health/db` y el pool a `buildApp`**

`apps/api/src/modules/health/routes.ts` (reemplazar completo):
```ts
import type { FastifyPluginAsync } from 'fastify';
import type { Pool } from 'mysql2/promise';
import { ERROR_CODES, type DbHealthResponse, type HealthResponse } from '@ekana/shared';
import { pingDatabase } from '../../db/connection.js';
import { AppError } from '../../lib/errors.js';

export function healthRoutes(deps: { pool: Pool }): FastifyPluginAsync {
  return async (app) => {
    app.get('/health', async (): Promise<HealthResponse> => ({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }));

    app.get('/health/db', async (request): Promise<DbHealthResponse> => {
      try {
        const latencyMs = await pingDatabase(deps.pool);
        return { status: 'ok', latencyMs };
      } catch (error) {
        request.log.warn({ err: error }, 'Ping a la BD falló');
        throw new AppError(503, ERROR_CODES.DB_UNAVAILABLE, 'Base de datos no disponible');
      }
    });
  };
}
```

En `apps/api/src/app.ts`:
- añadir `import type { Pool } from 'mysql2/promise';`
- cambiar la interfaz a:
```ts
export interface AppDeps {
  config: Config;
  pool: Pool;
}
```
- cambiar la firma a `export function buildApp({ config, pool }: AppDeps): FastifyInstance {`
- cambiar el registro de rutas a `app.register(healthRoutes({ pool }), { prefix: '/api' });`

En `apps/api/test/app.test.ts`, la app se crea con un pool que nunca llega a conectar (mysql2 es perezoso). Reemplazar el bloque de imports, la variable `app`, el `afterEach` y `createApp` (todo lo anterior a `describe('app', ...)`) por:
```ts
import { describe, it, expect, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { healthResponseSchema, errorResponseSchema } from '@ekana/shared';
import { buildApp } from '../src/app.js';
import { createPool } from '../src/db/connection.js';
import { AppError } from '../src/lib/errors.js';
import { makeTestConfig } from './helpers/config.js';

const config = makeTestConfig();
const lazyPool = createPool(config.db);
let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

afterAll(async () => {
  await lazyPool.end();
});

function createApp(): FastifyInstance {
  app = buildApp({ config, pool: lazyPool });
  return app;
}
```
El bloque `describe('app', ...)` no cambia.

- [ ] **Step 5: Correr todos los tests**

Run: `npm test`
Expected: PASS. El global setup crea `ekana_test` en el RDS la primera vez.

Si falla por conexión: verificar `DB_PASSWORD` en `.env` y que `DB_HOST` responde (`Test-NetConnection inti.cmso5z249brn.us-east-1.rds.amazonaws.com -Port 3306` en PowerShell).

- [ ] **Step 6: Preparar la BD de desarrollo**

Run: `npm run db:setup`
Expected: `BD "ekana" lista (utf8mb4_0900_ai_ci)`.

- [ ] **Step 7: Typecheck y commit**

Run: `npm run typecheck`
Expected: sin errores.

```bash
git add apps/api
git commit -m "feat(api): pool MySQL con SSL RDS, modo estricto, setup de BD y GET /api/health/db

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Esquema parte 1 (auth, perfiles, equipos), migrador y helpers de BD para tests

**Files:**
- Create: `apps/api/drizzle.config.ts`
- Create: `apps/api/src/db/client.ts`, `apps/api/src/db/migrations.ts`, `apps/api/src/db/migrate.ts`
- Create: `apps/api/src/db/schema/columns.ts`, `auth.ts`, `profiles.ts`, `teams.ts`, `index.ts`
- Create (generado): `apps/api/drizzle/0000_*.sql`, `apps/api/drizzle/meta/*`
- Create: `apps/api/test/helpers/db.ts`, `apps/api/test/helpers/factories.ts`
- Modify: `apps/api/test/global-setup.ts`
- Test: `apps/api/test/schema/users-teams.test.ts`

**Interfaces:**
- Consumes: `createPool`, `USER_ROLES`, `loadTestConfig`, `assertTestDatabaseName`.
- Produces:
  - Helpers de columnas: `id()`, `uuidRef()`, `createdAt()`, `updatedAt()`, `jsonObject()`, `jsonArray()`.
  - Tablas Drizzle: `users`, `sessions`, `accounts`, `verifications`, `profiles`, `teams`, `teamMembers`, `teamGoals`.
  - `createDb(pool: Pool)` y `type Db = ReturnType<typeof createDb>`.
  - `runMigrations(pool: Pool): Promise<void>`, `MIGRATIONS_FOLDER`.
  - Helpers de test: `testPool`, `testDb`, `resetDb(): Promise<void>`, `closeTestDb(): Promise<void>`, `expectDbError(promise, errno): Promise<void>`, `createUser(overrides?): Promise<{ id: string; email: string }>`, `createTeam(overrides?): Promise<{ id: string }>`.
  - Constantes de errno de MySQL: `ER_DUP_ENTRY = 1062`, `ER_DATA_TRUNCATED = 1265`.

- [ ] **Step 1: Configuración de drizzle-kit y cliente Drizzle**

`apps/api/drizzle.config.ts`:
```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
});
```

`apps/api/src/db/client.ts`:
```ts
import { drizzle } from 'drizzle-orm/mysql2';
import type { Pool } from 'mysql2/promise';
import * as schema from './schema/index.js';

export function createDb(pool: Pool) {
  return drizzle({ client: pool, schema, mode: 'default', casing: 'snake_case' });
}

export type Db = ReturnType<typeof createDb>;
```

`apps/api/src/db/migrations.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import type { Pool } from 'mysql2/promise';

// src/db y dist/db están a la misma profundidad: ambos apuntan a apps/api/drizzle.
export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

export async function runMigrations(pool: Pool): Promise<void> {
  await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS_FOLDER });
}
```

`apps/api/src/db/migrate.ts`:
```ts
import 'dotenv/config';
import { loadConfig } from '../config.js';
import { createPool } from './connection.js';
import { runMigrations } from './migrations.js';

const config = loadConfig();
const pool = createPool(config.db, { connectionLimit: 1 });
try {
  await runMigrations(pool);
  console.log(`Migraciones aplicadas en "${config.db.database}"`);
} finally {
  await pool.end();
}
```

- [ ] **Step 2: Esquema de auth, perfiles y equipos**

`apps/api/src/db/schema/columns.ts`:
```ts
import { randomUUID } from 'node:crypto';
import { char, datetime, json } from 'drizzle-orm/mysql-core';

export const id = () =>
  char({ length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID());

export const uuidRef = () => char({ length: 36 });

export const createdAt = () =>
  datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date());

export const updatedAt = () =>
  datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const jsonObject = () =>
  json()
    .$type<Record<string, unknown>>()
    .notNull()
    .$defaultFn(() => ({}));

export const jsonArray = () =>
  json()
    .$type<unknown[]>()
    .notNull()
    .$defaultFn(() => []);
```

`apps/api/src/db/schema/auth.ts` (tablas de Better Auth; nombres en plural, se mapean en la fase 2):
```ts
import { boolean, datetime, index, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { createdAt, id, updatedAt, uuidRef } from './columns.js';

export const users = mysqlTable('users', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = mysqlTable(
  'sessions',
  {
    id: id(),
    expiresAt: datetime({ mode: 'date', fsp: 3 }).notNull(),
    token: varchar({ length: 255 }).notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuidRef()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

export const accounts = mysqlTable(
  'accounts',
  {
    id: id(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuidRef()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: datetime({ mode: 'date', fsp: 3 }),
    refreshTokenExpiresAt: datetime({ mode: 'date', fsp: 3 }),
    scope: text(),
    password: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
);

export const verifications = mysqlTable(
  'verifications',
  {
    id: id(),
    identifier: varchar({ length: 255 }).notNull(),
    value: text().notNull(),
    expiresAt: datetime({ mode: 'date', fsp: 3 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);
```

`apps/api/src/db/schema/profiles.ts`:
```ts
import { boolean, date, mysqlTable, text, varchar } from 'drizzle-orm/mysql-core';
import { users } from './auth.js';
import { createdAt, jsonObject, updatedAt, uuidRef } from './columns.js';

// name, email y avatar (image) viven en `users`; aquí solo el resto del perfil.
export const profiles = mysqlTable('profiles', {
  id: uuidRef()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text(),
  activeCourse: varchar({ length: 255 }),
  isPremium: boolean().notNull().default(false),
  profileComplete: boolean().notNull().default(false),
  hasActiveTeam: boolean().notNull().default(false),
  birthDate: date({ mode: 'string' }),
  location: varchar({ length: 255 }),
  onboardingData: jsonObject(),
  preferences: jsonObject(),
  schedule: jsonObject(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
```

`apps/api/src/db/schema/teams.ts`:
```ts
import { datetime, index, int, mysqlEnum, mysqlTable, primaryKey, text, varchar } from 'drizzle-orm/mysql-core';
import { USER_ROLES } from '@ekana/shared';
import { createdAt, id, jsonArray, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';

export const teams = mysqlTable('teams', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
  bio: text(),
  avatarUrl: text(),
  courseName: varchar({ length: 255 }),
  currentRoadmapId: uuidRef(),
  settings: jsonObject(),
  resourceLinks: jsonArray(),
  activityStatus: varchar({ length: 32 }).notNull().default('active'),
  lastActive: datetime({ mode: 'date', fsp: 3 })
    .notNull()
    .$defaultFn(() => new Date()),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const teamMembers = mysqlTable(
  'team_members',
  {
    teamId: uuidRef()
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: mysqlEnum(USER_ROLES).notNull().default('member'),
    joinedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] }), index('team_members_user_idx').on(t.userId)],
);

export const teamGoals = mysqlTable('team_goals', {
  id: id(),
  teamId: uuidRef()
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  type: varchar({ length: 64 }),
  amount: int(),
  weeks: int(),
  description: text(),
  startDate: datetime({ mode: 'date', fsp: 3 }),
  createdAt: createdAt(),
});
```

`apps/api/src/db/schema/index.ts`:
```ts
export * from './auth.js';
export * from './profiles.js';
export * from './teams.js';
```

- [ ] **Step 3: Generar la migración**

Run: `npm run build:shared && npm run db:generate -w @ekana/api -- --name=auth_profiles_teams`
Expected: `drizzle/0000_auth_profiles_teams.sql` con 8 `CREATE TABLE`. Revisar a ojo que `team_members` tenga `PRIMARY KEY(team_id, user_id)` y `role enum('admin','member') NOT NULL DEFAULT 'member'`.

- [ ] **Step 4: Helpers de BD para tests y global setup con migraciones**

`apps/api/test/helpers/db.ts`:
```ts
import { expect } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { createPool } from '../../src/db/connection.js';
import { createDb } from '../../src/db/client.js';
import { loadTestConfig } from './config.js';

export const ER_DUP_ENTRY = 1062;
export const ER_DATA_TRUNCATED = 1265;

const config = loadTestConfig();
export const testPool = createPool(config.db, { multipleStatements: true, connectionLimit: 2 });
export const testDb = createDb(testPool);

export async function resetDb(): Promise<void> {
  const [rows] = await testPool.query<RowDataPacket[]>(
    `SELECT table_name AS name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' AND table_name <> '__drizzle_migrations'`,
  );
  if (rows.length === 0) return;
  const truncates = rows.map((row) => `TRUNCATE TABLE \`${String(row.name)}\`;`).join(' ');
  await testPool.query(`SET FOREIGN_KEY_CHECKS = 0; ${truncates} SET FOREIGN_KEY_CHECKS = 1;`);
}

export async function closeTestDb(): Promise<void> {
  await testPool.end();
}

// Drizzle envuelve los errores del driver en `cause`; el pool crudo los lanza directo.
export async function expectDbError(promise: Promise<unknown>, errno: number): Promise<void> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error, 'se esperaba un error de MySQL').not.toBeNull();
  const e = error as { errno?: number; cause?: { errno?: number } };
  expect(e.cause?.errno ?? e.errno).toBe(errno);
}
```

`apps/api/test/helpers/factories.ts`:
```ts
import { randomUUID } from 'node:crypto';
import { profiles, teams, users } from '../../src/db/schema/index.js';
import { testDb } from './db.js';

export async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  const email = overrides.email ?? `${id}@test.local`;
  await testDb.insert(users).values({ name: 'Usuario Test', ...overrides, id, email });
  await testDb.insert(profiles).values({ id });
  return { id, email };
}

export async function createTeam(overrides: Partial<typeof teams.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  await testDb.insert(teams).values({ name: 'Equipo Test', ...overrides, id });
  return { id };
}
```

`apps/api/test/global-setup.ts` (reemplazar completo):
```ts
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db/connection.js';
import { assertTestDatabaseName, ensureDatabase } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrations.js';

export default async function setup(): Promise<void> {
  const config = loadConfig(process.env);
  assertTestDatabaseName(config.db.database);
  await ensureDatabase(config.db);
  const pool = createPool(config.db, { connectionLimit: 1 });
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
```

- [ ] **Step 5: Escribir los tests del esquema**

`apps/api/test/schema/users-teams.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { profiles, teamMembers, teams, users } from '../../src/db/schema/index.js';
import { closeTestDb, ER_DATA_TRUNCATED, ER_DUP_ENTRY, expectDbError, resetDb, testDb, testPool } from '../helpers/db.js';
import { createTeam, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('users y profiles', () => {
  it('el email es único sin distinguir mayúsculas', async () => {
    await createUser({ email: 'Ana@Ekana.com' });
    await expectDbError(createUser({ email: 'ana@ekana.com' }), ER_DUP_ENTRY);
  });

  it('borrar un usuario borra su perfil y sus membresías', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id, role: 'admin' });

    await testDb.delete(users).where(eq(users.id, user.id));

    expect(await testDb.select().from(profiles).where(eq(profiles.id, user.id))).toHaveLength(0);
    expect(await testDb.select().from(teamMembers).where(eq(teamMembers.userId, user.id))).toHaveLength(0);
  });

  it('los JSON del perfil tienen valor por defecto {}', async () => {
    const user = await createUser();
    const [profile] = await testDb.select().from(profiles).where(eq(profiles.id, user.id));
    expect(profile?.preferences).toEqual({});
    expect(profile?.isPremium).toBe(false);
  });
});

describe('teams y team_members', () => {
  it('un usuario no puede estar dos veces en el mismo equipo', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id });
    await expectDbError(testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id }), ER_DUP_ENTRY);
  });

  it('el rol por defecto es member y un rol inválido se rechaza (modo estricto)', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id });
    const [member] = await testDb.select().from(teamMembers).where(eq(teamMembers.teamId, team.id));
    expect(member?.role).toBe('member');

    const other = await createUser();
    await expectDbError(
      testPool.query('INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW(3))', [
        team.id,
        other.id,
        'owner',
      ]),
      ER_DATA_TRUNCATED,
    );
  });

  it('updatedAt cambia al actualizar con Drizzle', async () => {
    const team = await createTeam();
    const [before] = await testDb.select().from(teams).where(eq(teams.id, team.id));
    await new Promise((resolve) => setTimeout(resolve, 20));
    await testDb.update(teams).set({ name: 'Renombrado' }).where(eq(teams.id, team.id));
    const [after] = await testDb.select().from(teams).where(eq(teams.id, team.id));
    expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });
});
```

- [ ] **Step 6: Correr los tests**

Run: `npm test`
Expected: PASS. El global setup aplica `0000_auth_profiles_teams.sql` sobre `ekana_test`.

- [ ] **Step 7: Aplicar la migración en desarrollo, typecheck y commit**

Run: `npm run db:migrate && npm run typecheck`
Expected: `Migraciones aplicadas en "ekana"` y typecheck sin errores.

```bash
git add apps/api
git commit -m "feat(db): esquema de auth, perfiles y equipos con migración inicial y tests

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Esquema parte 2 (roadmaps, entitlements, activaciones, progreso)

**Files:**
- Create: `apps/api/src/db/schema/roadmaps.ts`, `apps/api/src/db/schema/progress.ts`
- Modify: `apps/api/src/db/schema/index.ts`, `apps/api/test/helpers/factories.ts`
- Create (generado): `apps/api/drizzle/0001_*.sql`
- Test: `apps/api/test/schema/roadmaps-progress.test.ts`

**Interfaces:**
- Consumes: helpers de columnas, `profiles`, `teams`, `ROADMAP_OWNER_TYPES`, helpers de test.
- Produces:
  - Tablas: `roadmaps`, `units`, `subunits`, `userEntitlements`, `activations` (con la columna generada `teamKey`), `progressTracking`.
  - Factories: `createRoadmap(ownerId: string, overrides?)` → `{ id }`; `createUnitWithSubunit(roadmapId: string)` → `{ unitId, subunitId }`.

- [ ] **Step 1: Escribir el esquema**

`apps/api/src/db/schema/roadmaps.ts`:
```ts
import { boolean, datetime, index, int, mysqlEnum, mysqlTable, text, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { ROADMAP_OWNER_TYPES } from '@ekana/shared';
import { createdAt, id, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';

// owner_id es polimórfico (usuario o equipo según owner_type): sin FK, lo valida el servicio.
export const roadmaps = mysqlTable(
  'roadmaps',
  {
    id: id(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    ownerId: uuidRef().notNull(),
    ownerType: mysqlEnum(ROADMAP_OWNER_TYPES).notNull().default('USER'),
    isPublic: boolean().notNull().default(false),
    isPaid: boolean().notNull().default(false),
    metadata: jsonObject(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('roadmaps_owner_idx').on(t.ownerType, t.ownerId), index('roadmaps_public_idx').on(t.isPublic)],
);

export const units = mysqlTable(
  'units',
  {
    id: id(),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    sequenceOrder: int().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('units_roadmap_order_idx').on(t.roadmapId, t.sequenceOrder)],
);

export const subunits = mysqlTable(
  'subunits',
  {
    id: id(),
    unitId: uuidRef()
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 64 }).notNull(),
    contentUrl: text(),
    duration: varchar({ length: 64 }),
    sequenceOrder: int().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('subunits_unit_order_idx').on(t.unitId, t.sequenceOrder)],
);

export const userEntitlements = mysqlTable(
  'user_entitlements',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    accessType: varchar({ length: 64 }),
    expiresAt: datetime({ mode: 'date', fsp: 3 }),
  },
  (t) => [uniqueIndex('user_entitlements_user_roadmap_uq').on(t.userId, t.roadmapId)],
);
```

`apps/api/src/db/schema/progress.ts`:
```ts
import { sql } from 'drizzle-orm';
import { boolean, char, index, mysqlTable, uniqueIndex } from 'drizzle-orm/mysql-core';
import { createdAt, id, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { roadmaps, subunits } from './roadmaps.js';
import { teams } from './teams.js';

// team_key = COALESCE(team_id, '') hace que el UNIQUE también proteja las activaciones personales
// (team_id NULL). Es VIRTUAL porque MySQL rechaza FKs con acciones referenciales sobre la columna
// base de una columna generada STORED; con VIRTUAL la FK con CASCADE y el UNIQUE funcionan.
export const activations = mysqlTable(
  'activations',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef()
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    teamKey: char({ length: 36 })
      .notNull()
      .generatedAlwaysAs(sql`coalesce(\`team_id\`, '')`, { mode: 'virtual' }),
    isActive: boolean().notNull().default(true),
    startedAt: createdAt(),
  },
  (t) => [uniqueIndex('activations_user_roadmap_team_uq').on(t.userId, t.roadmapId, t.teamKey)],
);

export const progressTracking = mysqlTable(
  'progress_tracking',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    subunitId: uuidRef()
      .notNull()
      .references(() => subunits.id, { onDelete: 'cascade' }),
    activationId: uuidRef()
      .notNull()
      .references(() => activations.id, { onDelete: 'cascade' }),
    completedAt: createdAt(),
  },
  (t) => [
    uniqueIndex('progress_user_subunit_activation_uq').on(t.userId, t.subunitId, t.activationId),
    index('progress_user_idx').on(t.userId),
  ],
);
```

`apps/api/src/db/schema/index.ts` (reemplazar completo):
```ts
export * from './auth.js';
export * from './profiles.js';
export * from './teams.js';
export * from './roadmaps.js';
export * from './progress.js';
```

`apps/api/test/helpers/factories.ts` (reemplazar completo):
```ts
import { randomUUID } from 'node:crypto';
import { profiles, roadmaps, subunits, teams, units, users } from '../../src/db/schema/index.js';
import { testDb } from './db.js';

export async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  const email = overrides.email ?? `${id}@test.local`;
  await testDb.insert(users).values({ name: 'Usuario Test', ...overrides, id, email });
  await testDb.insert(profiles).values({ id });
  return { id, email };
}

export async function createTeam(overrides: Partial<typeof teams.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  await testDb.insert(teams).values({ name: 'Equipo Test', ...overrides, id });
  return { id };
}

export async function createRoadmap(ownerId: string, overrides: Partial<typeof roadmaps.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  await testDb.insert(roadmaps).values({ title: 'Roadmap Test', ownerType: 'USER', ...overrides, id, ownerId });
  return { id };
}

export async function createUnitWithSubunit(roadmapId: string) {
  const unitId = randomUUID();
  const subunitId = randomUUID();
  await testDb.insert(units).values({ id: unitId, roadmapId, title: 'Unidad 1', sequenceOrder: 1 });
  await testDb.insert(subunits).values({ id: subunitId, unitId, title: 'Lección 1', type: 'video', sequenceOrder: 1 });
  return { unitId, subunitId };
}
```

- [ ] **Step 2: Escribir los tests (fallan hasta generar la migración)**

`apps/api/test/schema/roadmaps-progress.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { activations, progressTracking, roadmaps, subunits, teams, units, userEntitlements } from '../../src/db/schema/index.js';
import { closeTestDb, ER_DUP_ENTRY, expectDbError, resetDb, testDb } from '../helpers/db.js';
import { createRoadmap, createTeam, createUnitWithSubunit, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('activations', () => {
  it('no permite activar dos veces el mismo roadmap personal', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await testDb.insert(activations).values({ userId: user.id, roadmapId: roadmap.id });
    await expectDbError(testDb.insert(activations).values({ userId: user.id, roadmapId: roadmap.id }), ER_DUP_ENTRY);
  });

  it('permite el mismo roadmap en modo personal y en equipos distintos', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const teamA = await createTeam();
    const teamB = await createTeam();
    await testDb.insert(activations).values([
      { userId: user.id, roadmapId: roadmap.id },
      { userId: user.id, roadmapId: roadmap.id, teamId: teamA.id },
      { userId: user.id, roadmapId: roadmap.id, teamId: teamB.id },
    ]);
    expect(await testDb.select().from(activations).where(eq(activations.userId, user.id))).toHaveLength(3);
  });

  it('borrar un equipo borra sus activaciones y su progreso, pero no las personales', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const { subunitId } = await createUnitWithSubunit(roadmap.id);
    const team = await createTeam();
    const [personalId, teamActivationId] = [crypto.randomUUID(), crypto.randomUUID()];
    await testDb.insert(activations).values([
      { id: personalId, userId: user.id, roadmapId: roadmap.id },
      { id: teamActivationId, userId: user.id, roadmapId: roadmap.id, teamId: team.id },
    ]);
    await testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId: teamActivationId });

    await testDb.delete(teams).where(eq(teams.id, team.id));

    const remaining = await testDb.select().from(activations);
    expect(remaining.map((a) => a.id)).toEqual([personalId]);
    expect(await testDb.select().from(progressTracking)).toHaveLength(0);
  });
});

describe('progress_tracking', () => {
  it('no permite completar dos veces la misma subunidad en la misma activación', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const { subunitId } = await createUnitWithSubunit(roadmap.id);
    const activationId = crypto.randomUUID();
    await testDb.insert(activations).values({ id: activationId, userId: user.id, roadmapId: roadmap.id });
    await testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId });
    await expectDbError(testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId }), ER_DUP_ENTRY);
  });
});

describe('roadmaps', () => {
  it('borrar un roadmap borra sus unidades y subunidades', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await createUnitWithSubunit(roadmap.id);
    await testDb.delete(roadmaps).where(eq(roadmaps.id, roadmap.id));
    expect(await testDb.select().from(units)).toHaveLength(0);
    expect(await testDb.select().from(subunits)).toHaveLength(0);
  });

  it('un usuario tiene como máximo un entitlement por roadmap', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await testDb.insert(userEntitlements).values({ userId: user.id, roadmapId: roadmap.id, accessType: 'full' });
    await expectDbError(
      testDb.insert(userEntitlements).values({ userId: user.id, roadmapId: roadmap.id, accessType: 'trial' }),
      ER_DUP_ENTRY,
    );
  });
});
```

Run: `npm test -w @ekana/api -- test/schema/roadmaps-progress.test.ts`
Expected: FAIL (`Table 'ekana_test.roadmaps' doesn't exist`).

- [ ] **Step 3: Generar la migración y correr los tests**

Run: `npm run build:shared && npm run db:generate -w @ekana/api -- --name=roadmaps_progress && npm test`
Expected: se genera `drizzle/0001_roadmaps_progress.sql` y todos los tests pasan. En el SQL, la columna `team_key` debe aparecer como `GENERATED ALWAYS AS (coalesce(\`team_id\`, '')) VIRTUAL NOT NULL` y la FK `activations.team_id` como `ON DELETE cascade ON UPDATE no action`.

- [ ] **Step 4: Aplicar en desarrollo, typecheck y commit**

Run: `npm run db:migrate && npm run typecheck`
Expected: OK.

```bash
git add apps/api
git commit -m "feat(db): roadmaps, entitlements, activaciones y progreso con deduplicación de activaciones

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Esquema parte 3 (comunicación, gamificación y sistema)

**Files:**
- Create: `apps/api/src/db/schema/communication.ts`, `apps/api/src/db/schema/gamification.ts`, `apps/api/src/db/schema/system.ts`
- Modify: `apps/api/src/db/schema/index.ts`
- Create (generado): `apps/api/drizzle/0002_*.sql`
- Test: `apps/api/test/schema/communication.test.ts`

**Interfaces:**
- Consumes: helpers de columnas, `users`, `profiles`, `teams`, `roadmaps`, enums de shared y helpers de test.
- Produces: tablas `requests`, `messages` (con `receiverId`), `notifications`, `pointEvents`, `badgeEvents`, `partners`, `systemEvents` y `analyticsEvents`. Con esto el esquema queda completo (22 tablas).

- [ ] **Step 1: Escribir el esquema**

`apps/api/src/db/schema/communication.ts`:
```ts
import { boolean, index, mysqlEnum, mysqlTable, text, varchar, type AnyMySqlColumn } from 'drizzle-orm/mysql-core';
import { NOTIFICATION_LEVELS, NOTIFICATION_TYPES, REQUEST_STATUSES, REQUEST_TYPES } from '@ekana/shared';
import { createdAt, id, jsonObject, updatedAt, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { roadmaps } from './roadmaps.js';
import { teams } from './teams.js';

export const requests = mysqlTable(
  'requests',
  {
    id: id(),
    type: mysqlEnum(REQUEST_TYPES).notNull(),
    senderId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    // NULL en REQUEST_TO_JOIN: la reciben todos los admins del equipo.
    recipientId: uuidRef().references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    roadmapId: uuidRef().references(() => roadmaps.id, { onDelete: 'set null' }),
    status: mysqlEnum(REQUEST_STATUSES).notNull().default('pending'),
    message: text(),
    newTeamName: varchar({ length: 255 }),
    makeAdmin: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('requests_recipient_status_idx').on(t.recipientId, t.status),
    index('requests_sender_idx').on(t.senderId),
    index('requests_team_status_idx').on(t.teamId, t.status),
  ],
);

// Exactamente uno de team_id / receiver_id tiene valor. Se valida en el API: MySQL prohíbe
// CHECK sobre columnas con acciones referenciales de FK.
export const messages = mysqlTable(
  'messages',
  {
    id: id(),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'cascade' }),
    receiverId: uuidRef().references(() => profiles.id, { onDelete: 'cascade' }),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    text: text().notNull(),
    handle: varchar({ length: 255 }),
    threadId: uuidRef().references((): AnyMySqlColumn => messages.id, { onDelete: 'cascade' }),
    bestResponseId: uuidRef().references((): AnyMySqlColumn => messages.id, { onDelete: 'set null' }),
    isDeleted: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('messages_team_created_idx').on(t.teamId, t.createdAt),
    index('messages_dm_idx').on(t.userId, t.receiverId, t.createdAt),
    index('messages_thread_idx').on(t.threadId),
  ],
);

export const notifications = mysqlTable(
  'notifications',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: mysqlEnum(NOTIFICATION_TYPES).notNull(),
    level: mysqlEnum(NOTIFICATION_LEVELS).notNull().default('info'),
    read: boolean().notNull().default(false),
    title: varchar({ length: 255 }),
    message: text(),
    link: text(),
    metadata: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_user_read_created_idx').on(t.userId, t.read, t.createdAt)],
);
```

`apps/api/src/db/schema/gamification.ts`:
```ts
import { index, int, mysqlTable, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import { createdAt, id, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { teams } from './teams.js';

// UNIQUE(user_id, unique_trigger_id): otorgar dos veces el mismo premio es imposible.
// Los eventos sin unique_trigger_id (NULL) no se deduplican.
export const pointEvents = mysqlTable(
  'point_events',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    points: int().notNull(),
    reason: varchar({ length: 255 }),
    uniqueTriggerId: varchar({ length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('point_events_user_trigger_uq').on(t.userId, t.uniqueTriggerId),
    index('point_events_team_created_idx').on(t.teamId, t.createdAt),
  ],
);

export const badgeEvents = mysqlTable(
  'badge_events',
  {
    id: id(),
    userId: uuidRef()
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    reason: varchar({ length: 255 }),
    uniqueTriggerId: varchar({ length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('badge_events_user_trigger_uq').on(t.userId, t.uniqueTriggerId),
    index('badge_events_team_created_idx').on(t.teamId, t.createdAt),
  ],
);
```

`apps/api/src/db/schema/system.ts`:
```ts
import { index, mysqlTable, varchar } from 'drizzle-orm/mysql-core';
import { users } from './auth.js';
import { createdAt, id, jsonObject, uuidRef } from './columns.js';
import { profiles } from './profiles.js';
import { teams } from './teams.js';

export const partners = mysqlTable('partners', {
  id: id(),
  name: varchar({ length: 255 }).notNull(),
});

export const systemEvents = mysqlTable('system_events', {
  id: id(),
  userId: uuidRef().references(() => profiles.id, { onDelete: 'set null' }),
  eventType: varchar({ length: 128 }).notNull(),
  payload: jsonObject(),
  createdAt: createdAt(),
});

export const analyticsEvents = mysqlTable(
  'analytics_events',
  {
    id: id(),
    userId: uuidRef().references(() => users.id, { onDelete: 'set null' }),
    teamId: uuidRef().references(() => teams.id, { onDelete: 'set null' }),
    eventType: varchar({ length: 128 }).notNull(),
    entityType: varchar({ length: 64 }),
    entityId: uuidRef(),
    metadata: jsonObject(),
    createdAt: createdAt(),
  },
  (t) => [
    index('analytics_events_type_created_idx').on(t.eventType, t.createdAt),
    index('analytics_events_entity_idx').on(t.entityId),
  ],
);
```

`apps/api/src/db/schema/index.ts` (reemplazar completo):
```ts
export * from './auth.js';
export * from './profiles.js';
export * from './teams.js';
export * from './roadmaps.js';
export * from './progress.js';
export * from './communication.js';
export * from './gamification.js';
export * from './system.js';
```

- [ ] **Step 2: Escribir los tests**

`apps/api/test/schema/communication.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import {
  analyticsEvents,
  badgeEvents,
  messages,
  notifications,
  pointEvents,
  profiles,
  requests,
  roadmaps,
  users,
} from '../../src/db/schema/index.js';
import { closeTestDb, ER_DATA_TRUNCATED, ER_DUP_ENTRY, expectDbError, resetDb, testDb, testPool } from '../helpers/db.js';
import { createRoadmap, createTeam, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('gamificación', () => {
  it('no se puede otorgar dos veces el mismo premio de puntos', async () => {
    const user = await createUser();
    await testDb.insert(pointEvents).values({ userId: user.id, points: 10, uniqueTriggerId: 'subunit:1' });
    await expectDbError(
      testDb.insert(pointEvents).values({ userId: user.id, points: 10, uniqueTriggerId: 'subunit:1' }),
      ER_DUP_ENTRY,
    );
  });

  it('los eventos sin unique_trigger_id no se deduplican', async () => {
    const user = await createUser();
    await testDb.insert(pointEvents).values([
      { userId: user.id, points: 5 },
      { userId: user.id, points: 5 },
    ]);
    expect(await testDb.select().from(pointEvents)).toHaveLength(2);
  });

  it('no se puede otorgar dos veces la misma insignia', async () => {
    const user = await createUser();
    await testDb.insert(badgeEvents).values({ userId: user.id, uniqueTriggerId: 'goal:1' });
    await expectDbError(testDb.insert(badgeEvents).values({ userId: user.id, uniqueTriggerId: 'goal:1' }), ER_DUP_ENTRY);
  });
});

describe('messages', () => {
  it('borrar al receptor borra sus mensajes directos', async () => {
    const sender = await createUser();
    const receiver = await createUser();
    await testDb.insert(messages).values({ userId: sender.id, receiverId: receiver.id, text: 'hola' });
    await testDb.delete(profiles).where(eq(profiles.id, receiver.id));
    expect(await testDb.select().from(messages)).toHaveLength(0);
  });

  it('borrar un mensaje raíz borra sus respuestas y deja en NULL la mejor respuesta', async () => {
    const user = await createUser();
    const team = await createTeam();
    const rootId = crypto.randomUUID();
    const replyId = crypto.randomUUID();
    const otherRootId = crypto.randomUUID();
    await testDb.insert(messages).values([
      { id: rootId, teamId: team.id, userId: user.id, text: 'pregunta' },
      { id: replyId, teamId: team.id, userId: user.id, text: 'respuesta', threadId: rootId },
      { id: otherRootId, teamId: team.id, userId: user.id, text: 'otra pregunta', bestResponseId: replyId },
    ]);

    await testDb.delete(messages).where(eq(messages.id, rootId));

    const remaining = await testDb.select().from(messages);
    expect(remaining.map((m) => m.id)).toEqual([otherRootId]);
    expect(remaining[0]?.bestResponseId).toBeNull();
  });
});

describe('notifications y requests', () => {
  it('una notificación nueva es info y no leída; un tipo inválido se rechaza', async () => {
    const user = await createUser();
    await testDb.insert(notifications).values({ userId: user.id, type: 'NEW_MESSAGE', title: 'Hola' });
    const [notification] = await testDb.select().from(notifications);
    expect(notification?.level).toBe('info');
    expect(notification?.read).toBe(false);

    await expectDbError(
      testPool.query('INSERT INTO notifications (id, user_id, type, metadata, created_at) VALUES (UUID(), ?, ?, ?, NOW(3))', [
        user.id,
        'NOPE',
        '{}',
      ]),
      ER_DATA_TRUNCATED,
    );
  });

  it('borrar el roadmap de una solicitud deja roadmap_id en NULL', async () => {
    const sender = await createUser();
    const roadmap = await createRoadmap(sender.id);
    await testDb.insert(requests).values({ type: 'CREATE_TEAM', senderId: sender.id, roadmapId: roadmap.id, newTeamName: 'X' });
    await testDb.delete(roadmaps).where(eq(roadmaps.id, roadmap.id));
    const [request] = await testDb.select().from(requests);
    expect(request?.roadmapId).toBeNull();
    expect(request?.status).toBe('pending');
  });

  it('borrar un usuario conserva sus eventos de analytics con user_id NULL', async () => {
    const user = await createUser();
    await testDb.insert(analyticsEvents).values({ userId: user.id, eventType: 'login' });
    await testDb.delete(users).where(eq(users.id, user.id));
    const [event] = await testDb.select().from(analyticsEvents);
    expect(event?.userId).toBeNull();
  });
});

describe('esquema completo', () => {
  it('tiene las 22 tablas del diseño', async () => {
    const [rows] = await testPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' AND table_name <> '__drizzle_migrations'`,
    );
    expect(Number(rows[0]?.n)).toBe(22);
  });
});
```
(Añadir `import type { RowDataPacket } from 'mysql2/promise';` a los imports del archivo.)

Run: `npm test -w @ekana/api -- test/schema/communication.test.ts`
Expected: FAIL (tablas inexistentes).

- [ ] **Step 3: Generar la migración y correr todos los tests**

Run: `npm run build:shared && npm run db:generate -w @ekana/api -- --name=communication_gamification_system && npm test`
Expected: se genera `drizzle/0002_communication_gamification_system.sql` y todos los tests pasan, incluido `tiene las 22 tablas del diseño`.

- [ ] **Step 4: Aplicar en desarrollo, typecheck y commit**

Run: `npm run db:migrate && npm run typecheck`
Expected: `Migraciones aplicadas en "ekana"` y typecheck sin errores.

```bash
git add apps/api
git commit -m "feat(db): comunicación, gamificación y sistema; esquema completo de 22 tablas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Seguridad HTTP y entrypoint del servidor

**Files:**
- Create: `apps/api/src/server.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/security.test.ts`

**Interfaces:**
- Consumes: `buildApp`, `createPool`, `loadConfig`, `AppError`, `ERROR_CODES`, `makeTestConfig`.
- Produces: el binario `node dist/server.js`, que escucha en `config.host:config.port` y cierra HTTP y el pool ante SIGINT/SIGTERM. `buildApp` registra helmet, CORS con lista blanca (`credentials: true`) y rate limiting (`config.rateLimitMax` por minuto y por IP; responde 429 `RATE_LIMITED`).

- [ ] **Step 1: Escribir los tests (fallan)**

`apps/api/test/security.test.ts`:
```ts
import { describe, it, expect, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { createPool } from '../src/db/connection.js';
import { makeTestConfig } from './helpers/config.js';

const config = makeTestConfig({ CORS_ORIGINS: 'https://app.ekana.test', RATE_LIMIT_MAX: '3' });
const lazyPool = createPool(config.db);

afterAll(async () => {
  await lazyPool.end();
});

describe('seguridad HTTP', () => {
  it('añade cabeceras de seguridad (helmet)', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    await app.close();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('permite CORS con credenciales solo a orígenes de la lista', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const allowed = await app.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://app.ekana.test' } });
    const denied = await app.inject({ method: 'GET', url: '/api/health', headers: { origin: 'https://malicioso.test' } });
    await app.close();
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.ekana.test');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('limita la tasa de peticiones y responde 429 RATE_LIMITED', async () => {
    const app = buildApp({ config, pool: lazyPool });
    const statuses: number[] = [];
    let last;
    for (let i = 0; i < 4; i++) {
      last = await app.inject({ method: 'GET', url: '/api/health' });
      statuses.push(last.statusCode);
    }
    await app.close();
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(last!.json().error.code).toBe('RATE_LIMITED');
  });
});
```

Run: `npm test -w @ekana/api -- test/security.test.ts`
Expected: FAIL (falta la cabecera `x-content-type-options`, no hay CORS ni 429).

- [ ] **Step 2: Registrar los plugins en `buildApp`**

En `apps/api/src/app.ts`:
- añadir los imports:
```ts
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ERROR_CODES } from '@ekana/shared';
import { AppError } from './lib/errors.js';
```
- justo después de `registerErrorHandling(app);` y **antes** de registrar las rutas, insertar:
```ts
  app.register(helmet);
  app.register(cors, { origin: config.corsOrigins, credentials: true });
  app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) =>
      new AppError(429, ERROR_CODES.RATE_LIMITED, `Demasiadas solicitudes, reintenta en ${context.after}`),
  });
```

Run: `npm test`
Expected: PASS, todos los tests.

- [ ] **Step 3: Crear el entrypoint**

`apps/api/src/server.ts`:
```ts
import 'dotenv/config';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createPool } from './db/connection.js';

const config = loadConfig();
const pool = createPool(config.db);
const app = buildApp({ config, pool });

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'Cerrando servidor');
  try {
    await app.close();
    await pool.end();
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'Error al cerrar');
    process.exit(1);
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ host: config.host, port: config.port });
```

- [ ] **Step 4: Compilar y probar el servidor real**

Run: `npm run build:api && ls apps/api/dist/server.js apps/api/dist/db/migrate.js`
Expected: existen ambos archivos.

Arrancar en segundo plano `npm run start -w @ekana/api` (con `apps/api/.env`) y luego:
Run: `curl -s http://localhost:3000/api/health && echo && curl -s http://localhost:3000/api/health/db`
Expected: `{"status":"ok","uptimeSeconds":...}` y `{"status":"ok","latencyMs":...}`. Detener el proceso.

- [ ] **Step 5: Typecheck y commit**

Run: `npm run typecheck`
Expected: sin errores.

```bash
git add apps/api
git commit -m "feat(api): helmet, CORS con lista blanca, rate limiting y entrypoint con apagado ordenado

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Frontend en `apps/web` conectado al API por proxy

**Files:**
- Create (copiados de `C:\proyectos\ekana-team-up-now`): `apps/web/src/**`, `apps/web/public/**`, `apps/web/index.html`, `components.json`, `eslint.config.js`, `postcss.config.js`, `tailwind.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `package.json`, `.env.example`
- Modify: `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/services/health/health.service.ts`
- Create: `apps/web/src/lib/api.ts`
- Local (no se versiona): `apps/web/.env`

**Interfaces:**
- Consumes: `GET /api/health/db` del API.
- Produces:
  - `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` con base `/api` y `credentials: 'include'`.
  - `api.get/post/patch/delete<T>(path, body?)`.
  - `class ApiError extends Error { status: number; code: string; details?: unknown }`.

- [ ] **Step 1: Copiar el front**

```bash
SRC=/c/proyectos/ekana-team-up-now
mkdir -p apps/web
cp -r "$SRC/src" "$SRC/public" apps/web/
cp "$SRC"/{index.html,components.json,eslint.config.js,postcss.config.js,tailwind.config.ts,tsconfig.json,tsconfig.app.json,tsconfig.node.json,vite.config.ts,package.json,.env.example} apps/web/
cp "$SRC/.env" apps/web/.env
git check-ignore apps/web/.env
```
Expected: imprime `apps/web/.env` (ignorado por git). No se copian `supabase/`, `node_modules/`, `bun.lockb`, `package-lock.json`, `CLAUDE.md` ni `IntegrationPlan.md`.

- [ ] **Step 2: Adaptar `package.json` y `vite.config.ts`**

En `apps/web/package.json`:
- cambiar `"name": "vite_react_shadcn_ts"` por `"name": "@ekana/web"`;
- eliminar la línea `"lovable-tagger": "^1.1.7",` de `devDependencies`.

`apps/web/vite.config.ts` (reemplazar completo):
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:3000",
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Run: `npm install`
Expected: instala las dependencias del front en el workspace sin errores.

- [ ] **Step 3: Cliente HTTP del API**

`apps/web/src/lib/api.ts`:
```ts
const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
  const data = parseJson(await response.text());
  if (!response.ok) {
    const body = (data ?? {}) as ErrorBody;
    throw new ApiError(
      response.status,
      body.error?.code ?? "HTTP_ERROR",
      body.error?.message ?? `Error HTTP ${response.status}`,
      body.error?.details,
    );
  }
  return data as T;
}

const withBody = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, withBody("POST", body)),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, withBody("PATCH", body)),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
```

- [ ] **Step 4: El health check de BD pasa por el API**

En `apps/web/src/services/health/health.service.ts`:
- añadir `import { api } from '@/lib/api';` junto a los imports existentes;
- reemplazar el cuerpo de `checkDb` por:
```ts
export async function checkDb(): Promise<HealthStatus> {
  return safeAsyncCheck(async () => {
    await api.get('/health/db');
  });
}
```
y actualizar su comentario JSDoc a `Checks database connectivity through the Ekana API (/api/health/db).`. `checkAuth` sigue usando Supabase hasta la fase 2.

- [ ] **Step 5: Verificar build y proxy**

Run: `npm run build:web`
Expected: `✓ built in ...` (los avisos de tamaño de chunk ya existían).

Arrancar en segundo plano `npm run dev:api` y `npm run dev:web`, y luego:
Run: `curl -s http://localhost:8080/api/health/db`
Expected: `{"status":"ok","latencyMs":...}` a través del proxy de Vite. Abrir `http://localhost:8080` y confirmar que la landing carga. Detener ambos procesos.

- [ ] **Step 6: Commit**

```bash
git add apps/web package-lock.json
git commit -m "feat(web): front movido a apps/web, proxy /api al API y cliente HTTP

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: CI en GitHub Actions y README

**Files:**
- Create: `.github/workflows/ci.yml`, `README.md`

**Interfaces:**
- Consumes: los scripts raíz `typecheck`, `test` y `build:web`.
- Produces: el check `CI`, que corre en cada PR y en cada push a `main`.

- [ ] **Step 1: Workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  api:
    runs-on: ubuntu-latest
    # Todos los runs comparten ekana_test en el RDS: nunca en paralelo.
    concurrency:
      group: ekana-test-db
      cancel-in-progress: false
    env:
      DB_HOST: ${{ secrets.DB_HOST }}
      DB_USER: ${{ secrets.DB_USER }}
      DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      DB_NAME: ekana_test
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build:web
```

El lint y el typecheck del front no entran en CI todavía: el código heredado tiene 82 errores de ESLint y 4 de TypeScript. Se corrigen al migrar cada dominio.

- [ ] **Step 2: README**

`README.md`:
````markdown
# Ekana

Plataforma de aprendizaje colaborativo. Monorepo con npm workspaces:

| Paquete | Qué es | Despliegue |
|---|---|---|
| `apps/web` | Front React + Vite + shadcn/ui | Vercel |
| `apps/api` | API Fastify + Drizzle (MySQL) | Railway |
| `packages/shared` | Esquemas zod y tipos compartidos | — |

Diseño: `docs/superpowers/specs/2026-09-10-ekana-mysql-migration-design.md`

## Requisitos

- Node 24 LTS (`.nvmrc`)
- Acceso al MySQL (RDS) configurado en `apps/api/.env` (copiar de `apps/api/.env.example`)

## Primeros pasos

```bash
npm install
npm run db:setup      # crea/ajusta la BD de DB_NAME (utf8mb4_0900_ai_ci)
npm run db:migrate    # aplica las migraciones
npm run dev:api       # API en http://localhost:3000
npm run dev:web       # front en http://localhost:8080 (proxy /api → API)
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm test` | Tests del API contra `ekana_test` (se crea sola; nunca toca `ekana`) |
| `npm run typecheck` | Typecheck de shared + API |
| `npm run build:shared && npm run db:generate -w @ekana/api -- --name=<cambio>` | Genera una migración a partir del esquema en `apps/api/src/db/schema` |
| `npm run build` | Build de shared, API y front |

## Reglas

- El esquema solo cambia con migraciones generadas y versionadas: nunca a mano.
- Secretos solo en `.env` (ignorado), en variables de Railway/Vercel o en secrets de GitHub.
````

- [ ] **Step 3: Commit y push**

```bash
git add .github README.md
git commit -m "ci: typecheck y tests del API contra ekana_test, build del front; README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 4: Secrets de GitHub (los configura el usuario)**

**Pedir al usuario** que entre en GitHub → `stevenbetancur/ekana` → Settings → Secrets and variables → Actions → New repository secret, y cree `DB_HOST` (`inti.cmso5z249brn.us-east-1.rds.amazonaws.com`), `DB_USER` (`admin`) y `DB_PASSWORD`. Después, relanzar el workflow desde la pestaña Actions.
Expected: el run de `CI` queda en verde en ambos jobs.

---

### Task 10: Despliegue del API en Railway

**Files:**
- Create: `railway.json`

**Interfaces:**
- Consumes: los scripts `build:api`, `start` y `db:migrate` del API.
- Produces: la URL pública de Railway (`https://<servicio>.up.railway.app`), que usa la Tarea 11.

- [ ] **Step 1: Configuración como código**

`railway.json`:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm run build:api",
    "watchPatterns": ["apps/api/**", "packages/shared/**", "package.json", "package-lock.json", "railway.json"]
  },
  "deploy": {
    "startCommand": "npm run start -w @ekana/api",
    "preDeployCommand": "npm run db:migrate -w @ekana/api",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

```bash
git add railway.json
git commit -m "chore: configuración de despliegue del API en Railway

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 2: Crear el servicio (lo hace el usuario en el dashboard de Railway)**

Guiar al usuario:
1. Railway → New Project → Deploy from GitHub repo → `stevenbetancur/ekana`.
2. En el servicio → Variables, crear: `NODE_ENV=production`, `LOG_LEVEL=info`, `DB_HOST=inti.cmso5z249brn.us-east-1.rds.amazonaws.com`, `DB_PORT=3306`, `DB_USER=admin`, `DB_PASSWORD=<la contraseña>`, `DB_NAME=ekana`, `DB_SSL=true`, `CORS_ORIGINS=http://localhost:8080` (se actualiza en la Tarea 11). `PORT` lo inyecta Railway.
3. Settings → Networking → Generate Domain.
4. Esperar el deploy (build → pre-deploy con migraciones → healthcheck).

- [ ] **Step 3: Verificar**

Run: `curl -s https://<dominio-railway>/api/health && echo && curl -s https://<dominio-railway>/api/health/db`
Expected: `{"status":"ok",...}` y `{"status":"ok","latencyMs":...}`. Anotar el dominio para la Tarea 11.

Si el pre-deploy falla: revisar en los logs de Railway que las variables `DB_*` estén bien y que el RDS acepte la conexión.

---

### Task 11: Despliegue del front en Vercel

**Files:**
- Create: `apps/web/vercel.json`

**Interfaces:**
- Consumes: el dominio de Railway de la Tarea 10.
- Produces: la URL pública de Vercel. `/api/*` se reescribe hacia Railway y el resto hace fallback a la SPA.

- [ ] **Step 1: Rewrites**

`apps/web/vercel.json` (sustituir `RAILWAY_DOMAIN` por el dominio anotado en la Tarea 10, p. ej. `ekana-api-production.up.railway.app`):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://RAILWAY_DOMAIN/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Run: `grep -c RAILWAY_DOMAIN apps/web/vercel.json`
Expected: `0` (se reemplazó por el dominio real).

```bash
git add apps/web/vercel.json
git commit -m "chore(web): rewrites de Vercel hacia el API en Railway y fallback SPA

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
git push
```

- [ ] **Step 2: Crear la cuenta y el proyecto (lo hace el usuario)**

Guiar al usuario:
1. Ir a vercel.com → Sign Up → **Continue with GitHub** (usa la cuenta `stevenbetancur`; el plan Hobby es gratuito).
2. Add New → Project → importar `stevenbetancur/ekana`.
3. Root Directory: `apps/web`. Framework Preset: Vite. Build Command: `npm run build`. Output Directory: `dist`.
4. Environment Variables (transitorias hasta la fase 2, copiadas de `apps/web/.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
5. Deploy.

- [ ] **Step 3: Verificar y cerrar CORS**

Run: `curl -s https://<dominio-vercel>/api/health/db && echo && curl -s -o /dev/null -w "%{http_code}" https://<dominio-vercel>/dashboard`
Expected: `{"status":"ok","latencyMs":...}` (a través del rewrite) y `200` (fallback SPA en una ruta profunda).

Pedir al usuario que en Railway actualice `CORS_ORIGINS=https://<dominio-vercel>,http://localhost:8080` (Railway redespliega solo).

- [ ] **Step 4: Cierre de la fase**

Confirmar con el usuario:
- CI en verde en `main`.
- `https://<dominio-vercel>` carga la app.
- `https://<dominio-vercel>/api/health/db` responde ok.
- `ekana` tiene 22 tablas y 3 migraciones aplicadas.

---

## Notas para la Fase 2 (no se implementan aquí)

- Better Auth debe generar IDs UUID (`advanced.database.generateId: () => crypto.randomUUID()`), porque `users.id` es `CHAR(36)`, y mapear sus modelos a las tablas en plural (`users`, `sessions`, `accounts`, `verifications`) con el adaptador Drizzle `provider: 'mysql'`.
- Al registrarse, crear la fila de `profiles` en la misma transacción (reemplaza el trigger `handle_new_user`).
- `buildApp` pasará a decorar `app.db` (`createDb(pool)`) cuando exista el primer módulo que lo use.
- Bugs detectados en el front heredado (hoy los oculta el TypeScript no estricto): `RequestContext.tsx:172` y `RoadmapEditor.tsx:242` pasan un `Promise<string>` donde se espera `string`. Corregirlos al migrar requests y roadmaps.
- `apiFetch` añadirá la redirección al login ante un 401 cuando exista la sesión.
