# Frontend (React + Vite + TypeScript + Tailwind CSS v4)

Dashboard shell with authentication pages. The header shows an API
availability indicator by calling `GET /api/health/` on the backend.

## Pages

- `/login` — email + password. On success goes to `/dashboard`.
- `/register` — name + email + password. On 201 goes to `/login`
  with a "Cuenta creada" notice; there is no auto-login, because the
  backend returns no tokens on register (same contract as path 1).
- `/dashboard` — requires a session (see the route guard below). Shows
  the user from `GET /api/auth/me/` (name, email, role) plus the API
  indicator, and an admin-only section only when the role is `admin`
  (it calls `GET /api/auth/admin-only/` and handles 403 gracefully).
  Non-admin users never see that section and never trigger the call.

Routing is a minimal history-based router (`src/lib/router.ts`) with
real URLs and back/forward support — no router library. Unknown paths
fall back to the login screen.

## Authentication and token handling

This is the SPA adaptation of the path-1 BFF pattern:

- The **access token lives in React memory only** (a ref inside
  `src/lib/auth.tsx`). It is never written to localStorage or
  sessionStorage.
- The **refresh token lives in Django's httpOnly cookie**
  (`refresh_token`, path `/api/auth/`, SameSite=Lax). JavaScript
  cannot read it; the browser sends it automatically because every
  request uses `credentials: "include"` (see `src/lib/api.ts`).
  Login still returns a JSON `refresh` field for backwards
  compatibility — the frontend ignores it on purpose and uses the
  cookie path only.
- `authFetch` (in `src/lib/auth.tsx`) retries once after a 401: it
  refreshes the access token — single-flight, so concurrent 401s
  share one refresh call — and replays the request exactly once. If
  the refresh fails, the session is cleared.
- Route guard (in `src/App.tsx`): `/dashboard` requires a session.
  On load, the provider restores it via `me()`; when only the cookie
  survived (e.g. after a page reload), the 401 → refresh → retry
  path restores it without asking for credentials again.
- Forms are controlled inputs with client-side validation (email
  format, required fields) plus the backend's messages, mapped to
  Spanish-friendly text in `src/lib/errors.ts`: known messages are
  translated, field errors keep the backend message verbatim with a
  Spanish field label, and unknown messages are shown verbatim.
- Styling follows the existing shell: premium rectangular buttons
  (44px height, 10px radius, no pills), shared form classes in
  `src/components/AuthLayout.tsx`.

## Run

```bash
pnpm install
pnpm dev
```

The app listens on http://localhost:{{FRONTEND_PORT}}.

## Environment

Copy `.env.example` to `.env` to override the API base URL:

```
VITE_API_URL=http://localhost:{{BACKEND_PORT}}
```

## Scripts

- `pnpm dev` — development server.
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm build` — production build into `dist/`.
- `pnpm preview` — serve the production build locally.

## pnpm 11 note

`pnpm-workspace.yaml` carries both `allowBuilds` and
`onlyBuiltDependencies` for `@tailwindcss/oxide`. pnpm 11 silently ignores
`onlyBuiltDependencies`; without `allowBuilds` the install fails with
`ERR_PNPM_IGNORED_BUILDS`.
