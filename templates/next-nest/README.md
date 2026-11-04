# {{PROJECT_TITLE}}

{{PROJECT_DESCRIPTION}}

Aplicación full-stack: frontend Next.js (App Router) + React + Tailwind,
backend NestJS hexagonal + Prisma + PostgreSQL + Redis, autenticación
con JWT (rotación de refresh + cookie httpOnly first-party vía BFF),
Docker Compose y CI en GitHub Actions.

> Generado desde la plantilla del camino dorado 1 de Buildora.
> Esta plantilla es una copia parametrizada de una aplicación real que
> funciona, no un motor generador: el código generado es 100% tuyo.

## Estructura

```text
frontend/   Next.js 16 + React 19 + Tailwind 4 (login, registro, dashboard, BFF de auth, middleware)
backend/    NestJS hexagonal (auth + users, Prisma, Postgres, Redis en compose)
.github/    CI (frontend: typecheck + build; backend: generate + build + tests)
```

## Arranque rápido

```bash
# 1. Variables de entorno (tres archivos; ver "Los dos .env del backend" abajo)
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp backend/src/shared/database/.env.example backend/src/shared/database/.env
# Edita backend/.env: cambia POSTGRES_PASSWORD, DATABASE_URL y los secretos JWT.

# 2. Servicios (desde backend/)
cd backend && docker compose up -d && cd ..

# 3. Dependencias
cd frontend && pnpm install && cd ..
cd backend && pnpm install && cd ..

# 4. Base de datos (cliente Prisma + migraciones)
cd backend
pnpm exec prisma generate --schema src/shared/database/prisma/schema.prisma
pnpm exec prisma migrate dev
cd ..

# 5. Desarrollo
cd frontend && pnpm dev   # http://localhost:{{FRONTEND_PORT}}
cd backend && pnpm start:dev   # http://localhost:{{BACKEND_PORT}}
```

## Scripts

Frontend (`frontend/`): `pnpm dev`, `pnpm build`, `pnpm start`,
`pnpm typecheck` (`tsc --noEmit`).

Backend (`backend/`): `pnpm start:dev` (watch), `pnpm build`,
`pnpm start:prod` (`node dist/main`), `pnpm test`,
`pnpm exec jest --passWithNoTests`.

## Auth (cómo funciona)

- Registro: `POST /api/v1/users` (directo al backend).
- Login/logout/refresh: vía BFF (`frontend/app/api/auth/*`); el refresh
  token vive en una cookie httpOnly first-party (`{{PROJECT_NAME}}_refresh_token`,
  path `/`, 7 días) y el access token solo en memoria (nunca localStorage).
- El middleware protege `/dashboard` por presencia de la cookie (la
  validez real la confirma `/me`).
- El refresh rota y el logout quema la familia de tokens (family-burn).
- Swagger del backend: `http://localhost:{{BACKEND_PORT}}/api/v1/docs`.

## Los dos .env del backend (importante)

Hay DOS archivos `.env` distintos y DOS lectores distintos:

- La app NestJS lee `backend/.env` (lo carga `dotenv/config` en `main.ts`
  desde el directorio de trabajo, `backend/`).
- Prisma (migrate/generate) lee `backend/src/shared/database/.env`
  (lo carga `dotenv/config` en `prisma7.config.ts`, que vive en ese
  mismo directorio).

Los dos deben tener la MISMA `DATABASE_URL`. Si solo editas uno, el
otro seguirá apuntando a otra base (o a ninguna) y el error te va a
confundir. Copia los dos `.env.example` y edítalos juntos.

## Volumen de Postgres (otro clásico)

El entrypoint de Postgres solo crea `POSTGRES_USER` en la primera
inicialización de un volumen VACÍO. Si cambias el usuario/base en
`.env` y el volumen ya existe con datos viejos, el nuevo usuario NO
se crea y la conexión falla. En ese caso:

```bash
cd backend && docker compose down -v && docker compose up -d
```

(Ojo: `down -v` BORRA los datos del volumen. Solo en desarrollo.)

## pnpm 11 y los scripts de construcción

El template incluye `pnpm-workspace.yaml` con las DOS claves
(`allowBuilds` para pnpm 11 y `onlyBuiltDependencies` para pnpm 10)
aprobando los paquetes que necesitan correr scripts de build
(frontend: `@tailwindcss/oxide`; backend: Prisma y compañía).
pnpm 11 ELIMINÓ `onlyBuiltDependencies` y la ignora en silencio: sin
`allowBuilds`, el install falla con `ERR_PNPM_IGNORED_BUILDS`.

## Notas honestas

- Redis está en `docker-compose.yml` listo para usar (caché/colas),
  pero el código de la app todavía no lo usa.
- Cambia `frontend/public/logo.svg` por tu propio logo.
- Cambia `name`, `description`, `author` y `license` en los
  `package.json` si lo necesitas: vienen con los valores del template.
- La página raíz (`/`) renderiza el login. Cuando tengas landing,
  ese es el archivo a sustituir (`frontend/app/page.tsx`).
