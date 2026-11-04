# {{PROJECT_TITLE}}

{{PROJECT_DESCRIPTION}}

Aplicación full-stack: frontend React + Vite + TypeScript + Tailwind CSS v4,
backend Django + Django REST Framework, autenticación con JWT (access en
memoria, refresh en cookie httpOnly), Docker Compose con PostgreSQL +
Redis y CI en GitHub Actions.

> Generado desde la plantilla del camino 2 (React + Vite + Django) de Buildora.
> Esta plantilla es una copia parametrizada de una aplicación real que
> funciona, no un motor generador: el código generado es 100% tuyo.

## Structure

- `frontend/` — React 19 + Vite + TypeScript + Tailwind CSS v4 (pnpm).
- `backend/` — Django 5 + Django REST Framework (Python).
- `docker-compose.yml` — database services only (PostgreSQL + Redis).

## Run the database services

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d
```

The `POSTGRES_*` values must match in both `.env` files: compose creates
the database with them, Django connects with them.

## Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The API listens on http://localhost:{{BACKEND_PORT}}. Health check:
`GET /api/health/` returns `{"status": "ok"}`. Auth endpoints live under
`/api/auth/` (register, login, refresh, logout, me, admin-only) — see
`backend/README.md`.

## Run the frontend

```bash
cd frontend
pnpm install
pnpm dev
```

The app listens on http://localhost:{{FRONTEND_PORT}} and reads the API base URL from
`VITE_API_URL` (see `frontend/.env.example`). Pages: `/login`,
`/register`, `/dashboard` (guarded, requires a session) — see
`frontend/README.md` for the token handling.

## Environment variables

| Variable | Default | Used by |
| --- | --- | --- |
| `POSTGRES_DB` | `{{POSTGRES_DB}}` | compose, Django |
| `POSTGRES_USER` | `{{POSTGRES_USER}}` | compose, Django |
| `POSTGRES_PASSWORD` | `cambia-esta-clave` | compose, Django |
| `DB_HOST` | `localhost` | Django |
| `DB_PORT` | `5432` | Django |
| `DJANGO_SECRET_KEY` | (generated at startup when unset) | Django |
| `DJANGO_DEBUG` | `1` | Django |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Django |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:{{FRONTEND_PORT}}` | Django |
| `CORS_ALLOW_CREDENTIALS` | `1` | Django — cross-origin httpOnly refresh cookie |
| `REFRESH_COOKIE_SECURE` | `0` | Django — `1` in production (HTTPS) |
| `DATABASE_ENGINE` | (unset = PostgreSQL) | Django — set `sqlite` for local tests only |
| `VITE_API_URL` | `http://localhost:{{BACKEND_PORT}}` | frontend |

## Gotchas

- **PostgreSQL volume:** `POSTGRES_USER` is only created on the first
  initialization of an *empty* volume. If you change the user or password
  after the first run, the old volume wins: run `docker compose down -v`
  to start from an empty volume (this deletes the database data).
- **pnpm 11:** `pnpm-workspace.yaml` in `frontend/` carries both
  `allowBuilds` and `onlyBuiltDependencies` for `@tailwindcss/oxide`.
  pnpm 11 silently ignores `onlyBuiltDependencies`; without `allowBuilds`
  the install fails with `ERR_PNPM_IGNORED_BUILDS`.
- **Two `.env` files:** compose reads the repository-root `.env`,
  Django reads `backend/.env` (and falls back to the root one). Keep the
  `POSTGRES_*` values identical in both.
- **Change the defaults before any shared use:** `cambia-esta-clave` is a
  development placeholder, and an unset `DJANGO_SECRET_KEY` generates an
  ephemeral key on every startup (sessions and signed data do not survive
  restarts in that mode).
