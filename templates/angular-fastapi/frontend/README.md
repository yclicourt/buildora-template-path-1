# Frontend (Angular)

Frontend for {{PROJECT_TITLE}}: Angular 22 + FastAPI.
Single-page app (standalone components, signals, Angular Router,
HttpClient) against the FastAPI backend.

## Run

```bash
pnpm install
pnpm start
```

The app serves on http://localhost:{{FRONTEND_PORT}} and talks to the backend at
http://localhost:{{BACKEND_PORT}} (see `src/environments/environment.ts` to point
it at another API).

## Pages

- `/login` — email + password. On success goes to `/dashboard` (or the
  `returnUrl` it came from).
- `/register` — name, email, password with a strength meter. The backend
  requires ≥ 8 characters and a password that is not only digits.
  A successful registration goes back to `/login`.
- `/dashboard` — protected by the auth guard. Shows the user (name,
  email, role) and a logout button. Admin users also get an admin
  section that calls `GET /api/auth/admin-only` and shows the result.

## Auth contract (summary)

The backend is the source of truth; see the backend README for the
full contract. Endpoints used here:

- `POST /api/auth/register` — 201, returns the user, no tokens.
- `POST /api/auth/login` — 200 `{ access, refresh }` + cookie.
- `POST /api/auth/refresh` — 200 `{ access }`, no body needed.
- `POST /api/auth/logout` — 200, blacklists the refresh token.
- `GET /api/auth/me` — 200 `{ id, name, email, role }`.
- `GET /api/auth/admin-only` — 200 / 401 / 403.

## Tokens and the cookie

- The **access token lives only in memory** (a private field of
  `AuthService`). It is never written to localStorage, sessionStorage,
  or any cookie. It lasts 15 minutes.
- The **refresh token lives only in the backend's httpOnly cookie**
  (`refresh_token`, path `/api/auth/`, SameSite=Lax, 7 days). The
  frontend never reads it: the browser sends it automatically on auth
  requests (all API calls use `withCredentials: true`).
- The JSON `refresh` field returned by login is **ignored on purpose**;
  only the cookie path is used.
- `AuthInterceptor` attaches the access token, and on a 401 refreshes
  it once (single-flight: concurrent 401s share one refresh request)
  and retries the original request a single time. A failed refresh
  clears the session and sends the user to `/login`.
- A page reload restores the session through the guard: refresh from
  the cookie, then `GET /api/auth/me`.

## Checks

```bash
pnpm run build
pnpm exec tsc --noEmit -p tsconfig.app.json
```
