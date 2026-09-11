# Ekana — Migración a Front + API + MySQL (diseño)

- **Fecha:** 2026-09-10
- **Estado:** aprobado (2026-09-10)
- **Origen:** `C:\proyectos\ekana-team-up-now` (Vite + React + Supabase, MVP con mocks)
- **Destino:** `C:\proyectos\ekana` — repo `https://github.com/stevenbetancur/ekana.git`

## 1. Objetivo

Convertir Ekana de un demo (Supabase + datos mock + localStorage) en una aplicación productiva con backend y base de datos propios, **conservando todas las funcionalidades actuales**.

**Criterios de "productivo":**
- Ningún dato de negocio en mocks ni en `localStorage`.
- Toda autorización se decide en el servidor y está cubierta por tests (caso permitido y caso denegado).
- Esquema versionado con migraciones; nunca cambios manuales en la BD.
- CI (lint + typecheck + tests) obligatorio antes de desplegar.
- Secretos solo en variables de entorno (Railway / Vercel / `.env` local ignorado por git).

**Fuera de alcance (se definirán después):**
- Migración de datos existentes desde Supabase (se arranca con BD vacía + seed de desarrollo).
- Ekky AI y Premium: se conservan tal como están (simulados). La conversación con Ekky AI sigue siendo local del navegador y no se persiste en `messages` hasta que se defina esa funcionalidad.

## 2. Arquitectura

| Pieza | Tecnología | Despliegue |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + shadcn/ui + TanStack Query | Railway: el API sirve el build (mismo dominio) |
| API | Node 20 + Fastify + TypeScript (estricto) | Railway (proceso long-running) |
| Base de datos | MySQL 8.0.45 en AWS RDS (us-east-1) | Servidor del usuario |
| ORM / migraciones | Drizzle ORM + drizzle-kit | Migraciones se ejecutan en el pre-deploy de Railway |
| Autenticación | Better Auth (adaptador Drizzle/MySQL) | Dentro del API |
| Realtime | Socket.IO | Dentro del API |
| Correo | Resend (API HTTPS) en producción; Nodemailer/SMTP o consola en local | Dentro del API |
| Validación / contrato | zod en `packages/shared` | Compartido front ↔ API |
| Tests | Vitest + `app.inject` de Fastify | Local y GitHub Actions |

### 2.1 Estructura del repositorio (monorepo, npm workspaces)

```
ekana/
├── apps/
│   ├── web/                     # front copiado de ekana-team-up-now y limpiado
│   │   ├── src/lib/api.ts       # cliente HTTP único
│   │   └── src/services/<dominio>/   # una sola implementación: llama al API
│   └── api/
│       └── src/
│           ├── config.ts        # variables de entorno validadas con zod
│           ├── db/              # esquema Drizzle + migraciones
│           ├── auth/            # Better Auth + envío de correos
│           ├── realtime/        # Socket.IO
│           ├── lib/             # errores, logger, helpers de autorización
│           └── modules/<dominio>/
│               ├── routes.ts    # endpoints + validación zod
│               ├── service.ts   # lógica de negocio y transacciones
│               └── policies.ts  # reglas de acceso
├── packages/
│   └── shared/                  # esquemas zod y tipos (contrato del API)
└── docs/
```

Dominios: `auth`, `profiles`, `teams`, `roadmaps`, `progress`, `gamification`, `requests`, `messages`, `notifications`, `analytics`, `health`.

### 2.2 Comunicación front ↔ API y sesiones

- **Un solo servicio en Railway (desde 2026-09-11):** el API sirve también el build del front (`apps/web/dist`) con `@fastify/static`: `assets/` con caché inmutable, `index.html` sin caché y fallback de la SPA para las navegaciones `GET` fuera de `/api`. Front y API comparten dominio (`https://ekana-production.up.railway.app`), así que la cookie de sesión es de primera parte y no hay proxy ni CORS.
- **Motivo:** Vercel suspendió las cuentas (equipo `ekana` y personal) el 2026-09-11 por "violación de términos" sin detallar la causa (probablemente plan Hobby usado para un SaaS/equipo). Se descartó apelar.
- **Socket.IO** (fase 6) conectará directo al mismo origen, sin el ticket que requería el diseño con Vercel.
- **Seguridad:** helmet con CSP estricta (`script-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`).
- **Con dominio propio (futuro):** se asigna el dominio al mismo servicio de Railway y se actualizan `APP_URL` y `CORS_ORIGINS`; no hay cambios de código.

## 3. Modelo de datos (MySQL)

18 tablas de dominio (las del esquema Supabase) + 4 tablas de Better Auth (`users`, `sessions`, `accounts`, `verifications`). Motor InnoDB, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci`.

**Tablas de dominio:** `profiles`, `teams`, `team_members`, `team_goals`, `roadmaps`, `units`, `subunits`, `activations`, `progress_tracking`, `requests`, `messages`, `notifications`, `point_events`, `badge_events`, `partners`, `system_events`, `user_entitlements`, `analytics_events`.

`profiles` es 1:1 con `users` (`profiles.id` = `users.id`, FK con `ON DELETE CASCADE`). `name`, `email` y el avatar (`image`) viven solo en `users` (los gestiona Better Auth); `profiles` guarda el resto de campos del perfil sin duplicarlos.

### 3.1 Reglas de traducción desde Postgres

| Postgres | MySQL |
|---|---|
| `UUID` / `gen_random_uuid()` | `CHAR(36)`, generado en la aplicación (`crypto.randomUUID()`) |
| `JSONB` + índices GIN | `JSON` sin índices (no se consultan por contenido hoy) |
| `TIMESTAMPTZ` | `DATETIME(3)`, siempre UTC (conexión con `timezone: 'Z'`) |
| `CREATE TYPE ... ENUM` | `ENUM(...)` en la columna |
| Trigger `handle_updated_at` / `DEFAULT now()` | `$defaultFn` / `$onUpdate` de Drizzle (todas las escrituras pasan por el ORM) |
| Trigger `handle_new_user` | Hook `databaseHooks.user.create.after` de Better Auth crea `profiles`; además `GET /api/v1/me` lo asegura de forma idempotente (`INSERT IGNORE`) por si el hook fallara |
| `UNIQUE INDEX ON lower(email)` | `UNIQUE(email)`; la collation ya es case-insensitive |
| Índice parcial `notifications WHERE read = false` | Índice `(user_id, read, created_at)` |
| `messages(team_id, created_at DESC)` | Índice `(team_id, created_at)`; MySQL lo recorre en orden inverso |

Se mantienen los enums existentes: `user_role (admin, member)`, `notification_type`, `notification_level`, `roadmap_owner_type (USER, TEAM, THIRD_PARTY)`, `request_type (CREATE_TEAM, INVITE_TO_TEAM, REQUEST_TO_JOIN)`, `request_status (pending, accepted, rejected, expired)`.

`roadmaps.owner_id` sigue siendo polimórfico (usuario o equipo según `owner_type`), sin FK; la integridad la garantiza el servicio.

### 3.2 Correcciones de esquema

1. **Activaciones duplicadas:** `UNIQUE(user_id, roadmap_id, team_id)` no protege cuando `team_id` es NULL (roadmap personal). Se añade la columna generada **virtual** `team_key = COALESCE(team_id, '')` y el único pasa a ser `(user_id, roadmap_id, team_key)`. `activations.team_id` pasa de `SET NULL` a `ON DELETE CASCADE` (al borrar un equipo se borran sus activaciones y su progreso). Es virtual y no almacenada porque MySQL 8.0.45 rechaza (`ER_CANNOT_ADD_FOREIGN`) FKs con acciones referenciales sobre la columna base de una columna generada almacenada; verificado en el RDS.
2. **Deduplicación de premios inexistente:** se añade `UNIQUE(user_id, unique_trigger_id)` en `point_events` y en `badge_events`. Otorgar un premio ya otorgado es una operación idempotente (no falla, no duplica).
3. **Mensajes directos sin destinatario:** el front maneja DMs (`receiverId`), pero la tabla `messages` de Supabase no tiene esa columna (`chat.supabase.ts` no la persiste). Se añade `receiver_id CHAR(36) NULL` (FK a `profiles`, `ON DELETE CASCADE`) e índice `(user_id, receiver_id, created_at)`. La regla "exactamente uno de `team_id` / `receiver_id`" se valida en el API (esquema zod compartido), porque MySQL prohíbe `CHECK` sobre columnas con acciones referenciales de FK.

### 3.3 Bases de datos por entorno

| Entorno | BD | Usuario |
|---|---|---|
| Desarrollo | `ekana` | `admin` |
| Tests (local y CI) | `ekana_test` (la crea automáticamente el setup de tests si no existe) | `admin` |
| Producción | `ekana_prod` (se crea en la fase 7) | `admin` (decisión del usuario: ambiente controlado) |

Decisión del usuario: se usa el usuario `admin` del RDS en todos los entornos. Consecuencia aceptada: una fuga de credenciales de la app da acceso a todas las BDs del servidor. Mitigaciones: credenciales solo en variables de entorno, conexión con SSL, y el setup de tests se niega a correr contra una BD cuyo nombre no termine en `_test`.

El charset/collation de `ekana` se fija con un script `db:setup` (`ALTER DATABASE ... utf8mb4_0900_ai_ci`) antes de la primera migración.

## 4. API

### 4.1 Convenciones

- Rutas bajo `/api/v1/...`; autenticación bajo `/api/auth/*` (Better Auth).
- JSON en entrada y salida; cada endpoint valida `body`, `params` y `query` con esquemas de `packages/shared`.
- Formato de error único: `{ "error": { "code": "TEAM_NOT_FOUND", "message": "...", "details": {...} } }`.
- Códigos: 400 validación, 401 sin sesión, 403 sin permiso, 404 no existe (o no visible), 409 conflicto, 429 rate limit, 500 error interno (sin filtrar detalles).

### 4.2 Autenticación

- Email + contraseña (mínimo 8 caracteres).
- **Verificación de email obligatoria:** no se puede iniciar sesión hasta confirmar el correo.
- Recuperación de contraseña por email (enlace de un solo uso con expiración).
- Sesión en cookie `httpOnly`, `Secure`, `SameSite=Lax`; duración 7 días con renovación por uso.
- Rate limiting en registro, login, reenvío de verificación y recuperación.
- Correos por `RESEND_API_KEY` + `EMAIL_FROM`. Railway bloquea el SMTP saliente salvo en el plan Pro, así que en producción se usa la API HTTPS de Resend; el transporte SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`) sigue disponible para desarrollo y, sin ninguno de los dos, los correos se imprimen en consola.

### 4.3 Reglas de autorización

Helpers: `requireAuth`, `requireTeamMember(teamId)`, `requireTeamAdmin(teamId)`, `canViewRoadmap`, `canEditRoadmap`. Los roles viven en `team_members` (nunca en `profiles`).

| Recurso | Leer | Crear | Editar / Borrar |
|---|---|---|---|
| Perfil | Público para cualquier autenticado: nombre, avatar, bio, ubicación, **edad calculada**, preferencias de aprendizaje (necesarias para emparejar equipos). Privado (solo el dueño): email y fecha de nacimiento exacta. Solo aparecen usuarios con email verificado | Al registrarse | Dueño (no puede auto-asignarse `isPremium` ni `hasActiveTeam`) |
| Equipo | Cualquier autenticado | Cualquier autenticado; el creador queda como admin | Solo admins |
| Miembros | Miembros del equipo | Solo al aceptar una solicitud/invitación | Admin cambia rol y expulsa; el usuario puede salir; el último admin no puede salir ni degradarse |
| Metas del equipo | Miembros | Miembros | Miembros |
| Roadmap / unidades / subunidades | Públicos; propios; de equipos donde es miembro | Usuario (personal); admin (de equipo) | Dueño; admin (de equipo) |
| Activación / progreso | Propios | Propios; requiere poder ver el roadmap y, si es de equipo, ser miembro | Propios |
| Solicitudes | Emisor; receptor; admins del equipo (en `REQUEST_TO_JOIN`) | Autenticado, con validación por tipo | Receptor o admin acepta/rechaza; emisor cancela |
| Mensajes de equipo | Miembros del equipo | Miembros del equipo | Autor (borrado lógico `is_deleted`) |
| Mensajes directos | Emisor y receptor | Solo entre usuarios que comparten al menos un equipo | Autor (borrado lógico) |
| Notificaciones | Propias | Solo el servidor | Propias (marcar leída, borrar) |
| Puntos / insignias | Propios; totales del equipo visibles a sus miembros (leaderboard) | Solo el servidor | Nadie |
| Entitlements | Propios | Solo el servidor | Solo el servidor |
| Analytics / system events | — | Propios | — |

Correcciones respecto a las RLS de Supabase: ya no es posible unirse a un equipo (ni auto-asignarse admin) insertando en `team_members`; editar el equipo requiere ser admin; los perfiles públicos no exponen datos personales; puntos, insignias y notificaciones solo los crea el servidor.

Un recurso no visible para el usuario responde 404 (no 403), para no revelar su existencia.

### 4.4 Efectos del lado del servidor

- Completar una subunidad → registra progreso y otorga puntos (idempotente por `unique_trigger_id`).
- Aceptar una solicitud → en una transacción: alta en `team_members`, actualización de la solicitud, notificaciones.
- Todo evento realtime se emite **después** del commit de la transacción.

### 4.5 Realtime

- Salas `user:{userId}` (notificaciones, solicitudes) y `team:{teamId}` (chat, cambios del equipo).
- Autenticación del socket con el ticket de 60 s; al unirse a `team:{id}` se verifica membresía.
- Eventos con nombre `<dominio>:<acción>` (p. ej. `message:created`, `notification:created`).

### 4.6 Transversal

- `config.ts` valida variables de entorno al arrancar; si falta alguna, el proceso no inicia.
- Logs estructurados con `pino` y `requestId` por petición; nunca se registran contraseñas, tokens ni cookies.
- `@fastify/helmet`, CORS con lista blanca de orígenes, `@fastify/rate-limit`.
- `GET /health` (proceso) y `GET /health/db` (ping a MySQL).
- Apagado ordenado (cierra HTTP, sockets y pool de conexiones).

## 5. Frontend

- Se copian las páginas, componentes, contexts y hooks actuales a `apps/web`.
- `src/lib/api.ts`: `fetch` con base `/api` y `credentials: 'include'`; convierte errores en `ApiError` tipado; ante 401 redirige al login.
- Se elimina `VITE_DATA_MODE`: cada `src/services/<dominio>/index.ts` exporta únicamente la implementación que llama al API; los tipos vienen de `packages/shared`.
- Los contexts se conservan como interfaz para las páginas, pero internamente usan TanStack Query (carga por página, caché, reintentos) en lugar de cargar todo al arrancar.
- `AuthContext` usa el cliente de Better Auth; se añaden pantallas de "verifica tu correo" y "nueva contraseña".
- Un único cliente Socket.IO; los eventos invalidan las consultas afectadas en React Query.
- Al cerrar cada dominio se eliminan: su parte de `mockData.ts`, su uso de `localStorage` para datos de negocio, y al final `@supabase/supabase-js`, `src/integrations/supabase` y `lovable-tagger`.
- Archivos muy grandes (p. ej. `TeamSettings.tsx`) se dividen solo cuando se trabaja su dominio.
- TypeScript estricto en `apps/api` y `packages/shared`; `apps/web` conserva su configuración actual.

## 6. Entornos, despliegue y calidad

- **Local:** `apps/web` en `:8080` con proxy de Vite `/api` → `http://localhost:3000`; `apps/api` en `:3000` contra la BD `ekana` del RDS.
- **Producción:** un servicio de Railway (build `npm run build` de shared + API + front, pre-deploy de migraciones, start `node dist/server.js`, que sirve API y SPA) + `ekana_prod`.
- **Red:** el RDS es de acceso público (el usuario ya lo usa desde Railway en otros proyectos), así que Railway y GitHub Actions se conectan directamente a `inti.cmso5z249brn.us-east-1.rds.amazonaws.com:3306` con SSL. No se requieren IPs estáticas.
- **Correo:** producción usa Resend. Mientras no haya dominio verificado, el remitente es `EMAIL_FROM=Ekana <onboarding@resend.dev>` y Resend solo entrega a la dirección dueña de la cuenta; al verificar el dominio definitivo se cambia el remitente y desaparece esa restricción. En desarrollo sirve el SMTP de Gmail con contraseña de aplicación.
- **Cuentas:** Railway (plan de pago, vinculado a GitHub) aloja todo. Vercel quedó descartado tras la suspensión de las cuentas.
- **Tests:** Vitest en `apps/api` con `app.inject` contra `ekana_test`; cada archivo de test limpia sus tablas. Toda regla de §4.3 tiene al menos un test "permitido" y uno "denegado".
- **CI (GitHub Actions):** en cada PR y push a `main`: lint, typecheck de los tres paquetes, tests del API y build del front.

## 7. Plan de fases

Cada fase termina desplegada: módulo del API + tests + front conectado + mocks del dominio eliminados.

| Fase | Entrega |
|---|---|
| 1. Fundaciones | Monorepo, esquema MySQL completo con migraciones, API con `/health`, front copiado arrancando contra el API, CI, primer despliegue Railway + Vercel |
| 2. Auth + perfiles | Registro con verificación, login, logout, recuperación de contraseña, onboarding, perfil propio y público |
| 3. Equipos | Crear equipo, miembros, roles, expulsar/salir, metas, settings, perfil público de equipo |
| 4. Roadmaps | Editor personal y de equipo, unidades, subunidades, copia de roadmaps de comunidad, entitlements |
| 5. Progreso + gamificación | Activaciones, completar subunidades, puntos, insignias, leaderboard |
| 6. Comunicación | Solicitudes (crear equipo, invitar, unirse), chat con hilos y mejor respuesta, DMs, notificaciones, realtime |
| 7. Cierre | Analytics, eliminación final de Supabase/mocks, BD `ekana_prod`, puesta en producción |

Cada fase tendrá su propio plan de implementación detallado.
