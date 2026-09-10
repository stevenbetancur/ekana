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
