# {{PROJECT_TITLE}}

{{PROJECT_DESCRIPTION}}

Aplicación full-stack: frontend Angular 22 + TypeScript + SCSS,
backend FastAPI + SQLAlchemy + Alembic, autenticación con JWT (access en
memoria, refresh en cookie httpOnly), Docker Compose con PostgreSQL +
Redis.

> Generado desde la plantilla del camino 3 (Angular + FastAPI) de Buildora.
> Esta plantilla es una copia parametrizada de una aplicación real que
> funciona, no un motor generador: el código generado es 100% tuyo.

## Structure

- `frontend/` — Angular 22 + TypeScript + SCSS (pnpm).
- `backend/` — FastAPI + SQLAlchemy + Alembic (Python).
- `docker-compose.yml` — database services only (PostgreSQL + Redis).

## Run the database services

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up -d
```

The `POSTGRES_*` values must match in both `.env` files: compose creates
the database with them, FastAPI connects with them.

## Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API listens on http://localhost:{{BACKEND_PORT}}. Health check:
`GET /api/health` returns `{"status": "ok"}`. Auth endpoints live under
`/api/auth` (register, login, refresh, logout, me, admin-only) — see
`backend/README.md`. Swagger UI at `/api/docs`.

## Run the frontend

```bash
cd frontend
pnpm install
pnpm start
```

The app listens on http://localhost:{{FRONTEND_PORT}} and reads the API base URL from
`src/environments/environment.ts`. Pages: `/login`,
`/register`, `/dashboard` (guarded, requires a session) — see
`frontend/README.md` for the token handling.

## Environment variables

| Variable | Default | Used by |
| --- | --- | --- |
| `POSTGRES_DB` | `{{POSTGRES_DB}}` | compose, FastAPI |
| `POSTGRES_USER` | `{{POSTGRES_USER}}` | compose, FastAPI |
| `POSTGRES_PASSWORD` | `cambia-esta-clave` | compose, FastAPI |
| `DB_HOST` | `localhost` | FastAPI |
| `DB_PORT` | `5432` | FastAPI |
| `SECRET_KEY` | (generated at startup when unset) | FastAPI |
| `DEBUG` | `1` | FastAPI |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:{{FRONTEND_PORT}}` | FastAPI |
| `CORS_ALLOW_CREDENTIALS` | `1` | FastAPI — cross-origin httpOnly refresh cookie |
| `REFRESH_COOKIE_SECURE` | `0` | FastAPI — `1` in production (HTTPS) |
| `DATABASE_ENGINE` | (unset = PostgreSQL) | FastAPI — set `sqlite` for local tests only |

## Gotchas

- **PostgreSQL volume:** `POSTGRES_USER` is only created on the first
  initialization of an *empty* volume. If you change the user or password
  after the first run, the old volume wins: run `docker compose down -v`
  to start from an empty volume (this deletes the database data).
- **Two `.env` files:** compose reads the repository-root `.env`,
  FastAPI reads `backend/.env` (and falls back to the root one). Keep the
  `POSTGRES_*` values identical in both.
- **Change the defaults before any shared use:** `cambia-esta-clave` is a
  development placeholder, and an unset `SECRET_KEY` generates an
  ephemeral key on every startup (sessions and signed data do not survive
  restarts in that mode).
- **CI:** one combined GitHub Actions workflow
  (`.github/workflows/ci.yml`): frontend `pnpm install
  --frozen-lockfile` + `tsc --noEmit` + `pnpm run build` (Node 22),
  backend `pip install` + `alembic upgrade
  head` + `pytest` (Python 3.12) against a real Postgres 16 service.
  Same shape as the path-2 template's combined CI. Note the CI uses
  `pnpm/action-setup` with no `version:` input: the version comes
  from the `packageManager` field of `package.json` (adding a
  `version:` input makes the action fail with "Multiple versions of
  pnpm specified").
- **favicon.ico:** the template does not include one (it is a binary
  file). `src/index.html` references `favicon.ico`, so the browser
  requests it and gets a 404 until you drop your own icon into
  `frontend/public/favicon.ico`. Cosmetic only — the app works without it.
  The `public/` directory is kept in the template by a `.gitkeep` file.
