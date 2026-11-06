# Plantillas de Buildora (caminos dorados 1, 2 y 3)

Copias parametrizadas de los tres caminos dorados reales de Buildora,
listas para generar una aplicación full-stack que corre. **No es un
motor generador general**: cada plantilla es la aplicación de su camino
con los valores propios de Buildora sustituidos por variables.

## Contenido

```text
templates/next-nest/     La aplicación camino 1 (frontend/ + backend/ + CI + README del proyecto)
templates/react-django/  La aplicación camino 2 (frontend/ + backend/ + CI + README del proyecto)
templates/angular-fastapi/  La aplicación camino 3 (frontend/ + backend/ + CI + README del proyecto)
scripts/generate.mjs   Generador desde un clon (usa scripts/lib/generate.mjs)
scripts/lib/generate.mjs  Núcleo de generación (compartido con el CLI)
bin/buildora.mjs       CLI `buildora` (paquete npm, cero dependencias)
package.json           Paquete npm `buildora` (bin + files)
```

## CLI (npm): `buildora`

Sin clonar el repo:

```bash
npx buildora generate mi-proyecto --stack next-nest
npx buildora generate mi-proyecto --stack react-django
npx buildora generate mi-proyecto --stack angular-fastapi
# o instalado global:
npm install -g buildora
buildora generate mi-proyecto --stack react-django
```

Opciones de `buildora generate`:

| Opción | Valor |
| --- | --- |
| `--stack` | Stack a generar: `next-nest`, `react-django` o `angular-fastapi` (por defecto: `next-nest`) |
| `--title` | Título (por defecto: derivado del nombre) |
| `--description` | Descripción (por defecto: genérica del stack) |
| `--frontend-port` | Puerto del frontend (next-nest: `3000`; react-django: `5173`; angular-fastapi: `4200`) |
| `--backend-port` | Puerto del backend (next-nest: `3001`; react-django: `8000`; angular-fastapi: `8000`) |
| `--db-user` | Usuario Postgres (por defecto: nombre en snake_case) |
| `--db-name` | Base Postgres (por defecto: nombre en snake_case) |
| `--force` | Sobrescribe el directorio de salida si no está vacío |

Nota sobre `--stack`: cualquier valor fuera de `next-nest`,
`react-django` y `angular-fastapi` falla con la lista de stacks disponibles. Sin
directorio de salida, el CLI crea el proyecto en el directorio actual
(`./<nombre-kebab>`); la plantilla se resuelve desde la ubicación del
paquete, así que funciona igual instalado globalmente que con `npx`.

## Variables

| Variable | Valor |
| --- | --- |
| `{{PROJECT_NAME}}` | Nombre en kebab-case que pasas al generador (`mi-tienda`) |
| `{{PROJECT_TITLE}}` | Derivado del nombre (`Mi Tienda`), o `--title` explícito |
| `{{PROJECT_DESCRIPTION}}` | Genérica del stack, o `--description` explícita |
| `{{FRONTEND_PORT}}` | `3000` (next-nest), `5173` (react-django) o `4200` (angular-fastapi) (`--frontend-port`) |
| `{{BACKEND_PORT}}` | `3001` (next-nest) o `8000` (react-django y angular-fastapi) (`--backend-port`) |
| `{{POSTGRES_USER}}` | Nombre en snake_case (`mi_tienda`), o `--db-user` |
| `{{POSTGRES_DB}}` | Nombre en snake_case (`mi_tienda`), o `--db-name` |

La contraseña de Postgres NO es variable: los `.env.example` traen
`cambia-esta-clave` y el usuario la cambia junto con `DATABASE_URL`
(ver `templates/<stack>/README.md`).

## Generar un proyecto (desde un clon del repo)

```bash
node scripts/generate.mjs mi-tienda
# Sin directorio de salida, crea mi-tienda dentro del repo.

node scripts/generate.mjs mi-tienda /ruta/salida --title "Mi Tienda" --force
node scripts/generate.mjs mi-tienda /ruta/salida --stack react-django
```

El generador copia `templates/<stack>/`, sustituye todas las variables en los
archivos de texto (los binarios se copian tal cual), renombra
archivos/directorios que contengan variables e imprime los pasos
siguientes concretos. Se niega a sobrescribir un directorio no vacío
salvo que pases `--force`.

## Correr el proyecto generado

Camino 1 (el detalle completo está en `templates/next-nest/README.md`):

```bash
cd mi-tienda
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp backend/src/shared/database/.env.example backend/src/shared/database/.env
# Edita backend/.env: POSTGRES_PASSWORD, DATABASE_URL y secretos JWT.
cd backend && docker compose up -d && cd ..
cd frontend && pnpm install && cd .. && cd backend && pnpm install && cd ..
cd backend && pnpm exec prisma generate --schema src/shared/database/prisma/schema.prisma
cd backend && pnpm exec prisma migrate dev && cd ..
cd frontend && pnpm dev        # http://localhost:3000
cd backend && pnpm start:dev   # http://localhost:3001
```

Camino 2 (el detalle completo está en `templates/react-django/README.md`):

```bash
cd mi-tienda
cp .env.example .env
cp backend/.env.example backend/.env
# Edita ambos: cambia POSTGRES_PASSWORD (la misma en los dos).
docker compose up -d
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python manage.py migrate && cd ..
cd frontend && pnpm install && pnpm dev   # http://localhost:5173
cd backend && python manage.py runserver  # http://localhost:8000 (con el venv activado)
```

Camino 3 (el detalle completo está en `templates/angular-fastapi/README.md`):

```bash
cd mi-tienda
cp .env.example .env
cp backend/.env.example backend/.env
# Edita ambos: cambia POSTGRES_PASSWORD (la misma en los dos).
docker compose up -d
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && alembic upgrade head && cd ..
cd frontend && pnpm install && pnpm start   # http://localhost:4200
cd backend && uvicorn app.main:app --reload  # http://localhost:8000 (con el venv activado)
```

## Gotchas documentados (vienen del proyecto real)

1. **Dos `.env`, dos lectores.** La app NestJS lee `backend/.env`;
   Prisma (migrate/generate) lee `backend/src/shared/database/.env`.
   Los dos deben tener la MISMA `DATABASE_URL`.
2. **Volumen de Postgres.** El entrypoint solo crea `POSTGRES_USER`
   en la primera inicialización de un volumen VACÍO. Si cambias el
   usuario/base con un volumen ya existente, hay que hacer
   `docker compose down -v` (borra los datos; solo en desarrollo).
3. **pnpm 11 y los scripts de build.** Los `pnpm-workspace.yaml`
   de los caminos 1 y 2 llevan las DOS claves: `allowBuilds`
   (pnpm 11) y `onlyBuiltDependencies` (pnpm 10). pnpm 11 ELIMINÓ
   `onlyBuiltDependencies` y la ignora en silencio; sin `allowBuilds`,
   el install falla con `ERR_PNPM_IGNORED_BUILDS`. El del camino 3
   lleva solo `allowBuilds`, como en el repo de referencia (es lo
   único que pnpm 11 necesita).
4. **Prisma en esta VM.** Las descargas de binarios de Prisma fallan
   por el proxy de egress de esta VM; el build del backend puede no
   completarse aquí aunque el código esté bien. En CI y en la máquina
   del desarrollador (con red normal) funciona.
5. **Redis.** Está en `docker-compose.yml` listo para usar, pero el
   código de la app todavía no lo usa (caché/colas futuras).

Los gotchas del camino 2 (volumen de Postgres, pnpm 11, dos `.env`)
están en `templates/react-django/README.md`. Los del camino 3 (volumen
de Postgres, dos `.env`, CI combinado, favicon.ico) están en
`templates/angular-fastapi/README.md`.

## Desviaciones del camino 2 respecto a sus fuentes

1. Los 7 archivos "nuevos" de GitHub (requirements, settings, urls,
   views, serializers, tests, README del backend) resultaron
   **byte-idénticos** a la copia de trabajo: la copia ya los tenía
   porque fue la fuente de esos pushes. La "sustitución" fue un no-op
   verificado con `diff` contra el clon de `buildora-path2-backend`
   (HEAD `3953449`), no una suposición.
2. Los 3 `__init__.py` del backend llevan `# Package marker.`: la
   copia los tenía vacíos y los repos los llevan así (la API de
   GitHub rechaza archivos vacíos).
3. CI único y combinado en la raíz (`templates/react-django/.github/`),
   en vez de los dos workflows separados de las fuentes. Los CI
   por-repo de frontend y backend NO entran en la plantilla.
4. `backend/docker-compose.yml` (copia del repo backend) NO entra en
   la plantilla: el proyecto generado usa el compose de la raíz.
5. `backend/db.sqlite3`, `__pycache__/`, `.venv/`, `dist/` y
   `node_modules/` excluidos; el generador además ignora
   `db.sqlite3` aunque aparezca (lista `SKIP_FILES`).
6. READMEs: el de la raíz reescrito con cabecera de plantilla
   (título/descripción variables, resto del de referencia
   tokenizado); el del backend sin el lenguaje de sprints
   ("Sprint 1 scope"/"Auth sprint scope" → descripción directa).
   El README raíz quedó con cabecera en español y cuerpo en inglés
   (el de la referencia); los READMEs de frontend y backend siguen
   en inglés como en la referencia.
7. Título de Swagger: `"Buildora camino 2 API"` → `"{{PROJECT_TITLE}} API"`,
   igual que el camino 1 (`setTitle('{{PROJECT_TITLE}} API')`).
8. Los `.gitignore` de la plantilla se guardan como `gitignore` (sin
   punto), igual que el camino 1: npm los excluye del tarball y el
   generador les devuelve el punto al generar.
9. El wrapper `node scripts/generate.mjs` ahora acepta `--stack`
   (antes no lo tenía): sin el flag genera `next-nest`, así que las
   invocaciones viejas se comportan igual.
10. `TEMPLATE_DIR` (singular) desapareció del núcleo: ahora es
    `TEMPLATES_DIR` + `templateDirFor(stack)`. Nada fuera del
    generador lo importaba.

## Desviaciones respecto a las fuentes

1. `frontend/package-lock.json` excluido: la plantilla es pnpm-only.
2. `backend/test/` excluido: el spec e2e del scaffold probaba una
   ruta (`GET /`) que la app no tiene (tiene prefijo `api/v1/` y
   ningún controlador raíz). El CI corre `jest --passWithNoTests`
   como en la fuente.
3. READMEs de las fuentes sustituidos por `template/README.md`
   (el de Nest era el scaffold por defecto, no describía esta app).
4. `frontend/public/logo-buildora.svg` sustituido por un
   `public/logo.svg` genérico (mismo dibujo, sin marca); todas las
   referencias actualizadas. El usuario lo reemplaza por su logo.
5. `panel-terminal.svg` y los SVG por defecto de Next
   (`file/globe/next/vercel/window.svg`) excluidos: no los referencia
   ningún componente (los héroes dibujan sus terminales en JSX).
6. Copia de los héroes y del dashboard neutralizada (sin lenguaje
   del generador: "camino dorado", "scaffold", "Buildora forja",
   "Sin tarjeta · Cancela cuando quieras", "multi-tenant"): misma
   estructura y diseño, texto genérico de aplicación.
7. `main.ts`: el fallback de puerto pasa de `3000` a
   `{{BACKEND_PORT}}` para no chocar con el frontend si falta `.env`.
8. `template/.github/workflows/ci.yml` único y combinado (trabajos
   frontend + backend con servicios Postgres/Redis), en vez de los
   dos workflows separados de las fuentes.
9. `backend/.env.example` añade las variables `POSTGRES_*` que lee el
   compose (la fuente confiaba en los defaults) y
   `src/shared/database/.env.example` es nuevo (exigido por el
   gotcha 1).
10. Sin datos personales: no hay usuarios, correos, nombres ni
    credenciales reales en la plantilla (los secretos de ejemplo son
    `cambia-esta-clave` / `cambia-este-secreto`).
11. Los `.gitignore` de la plantilla se guardan como `gitignore` (sin
    punto): npm excluye del tarball cualquier archivo llamado
    `.gitignore`, así que el generador les devuelve el punto al
    generar. Los proyectos generados sí tienen sus `.gitignore`.

## Verificación (2026-11-03, proyecto de prueba `mi-tienda-prueba`)

- Generador: 109 archivos, cero `{{...}}` sobrantes, cero strings
  personales, única mención de "Buildora" = la línea de procedencia
  en el README generado.
- Frontend: `pnpm install` limpio (sin `ERR_PNPM_IGNORED_BUILDS`),
  `pnpm typecheck` 0 errores, `pnpm build` verde (rutas `/`, `/login`,
  `/register`, `/dashboard`, BFF auth, middleware).
- Backend: verificación estructural completa (diff contra las fuentes:
  solo `main.ts`, `swagger.config.ts` y el nuevo `.env.example`
  difieren; el resto es byte-idéntico). Build NO verificable en esta
  VM: `pnpm install` falla en el postinstall de `@prisma/engines`
  (descarga de binarios bloqueada por el proxy de egress, ver nota 4);
  sin install completo no hay binarios `prisma`/`nest` para generar
  ni compilar. En CI y en máquina con red normal funciona (las
  fuentes tienen CI en verde).
- Nota de entorno: `/tmp` es un tmpfs de 512M y se llenó durante la
  primera verificación (el store de pnpm + `node_modules` del
  proyecto de prueba); la verificación final se hizo con el proyecto
  y el store de pnpm en el home. No es un problema de la plantilla.

## Verificación 0.2.0 (2026-11-04, camino 2 + camino 1)

- Generador: `mi-tienda-dos` (react-django, flags personalizados:
  título, puertos 4000/4001, db `mi_tienda_dos`) = 47 archivos;
  `mi-tienda-uno` (next-nest, defaults) = 109 archivos, igual que en
  0.1.0; wrapper `node scripts/generate.mjs --stack react-django` =
  47 archivos. Cero `{{...}}` sobrantes y cero strings personales en
  los tres. `--stack foo` → exit 1 con la lista de disponibles.
  `--version` = 0.2.0.
- Camino 2 generado: frontend `pnpm install --frozen-lockfile`
  limpio, `pnpm typecheck` 0 errores, `pnpm build` verde (37
  módulos). Backend `manage.py check` limpio, `manage.py test` 16
  tests OK (incluye el test de login duplicado y las vistas con
  Swagger), `manage.py spectacular --validate` OK. Pruebas con
  `DATABASE_ENGINE=sqlite`; la prueba real contra Postgres queda
  para el CI tras el push, igual que con la referencia.
- Camino 1 generado: `pnpm install --frozen-lockfile` limpio,
  `pnpm typecheck` 0 errores, `pnpm build` verde (rutas `/`, `/login`,
  `/register`, `/dashboard`, BFF auth, middleware). Sin regresión.
- `npm pack`: tarball 162 archivos = 109 (next-nest) + 47
  (react-django) + bin + 2 scripts + package.json + README + LICENSE.
  Cero `.gitignore` en el tarball (npm los excluye) y 6 `gitignore`
  (sin punto) presentes. Bin extraído del tarball: `--version`
  0.2.0, `--help` con ambos stacks, genera react-django (47
  archivos, 3 `.gitignore` restaurados, cero tokens).

## Desviaciones del camino 3 respecto a sus fuentes

1. CI único y combinado en la raíz
   (`templates/angular-fastapi/.github/`), igual que el camino 2. Los
   CI por-repo de frontend y backend NO entran en la plantilla: el
   generado corre frontend (`pnpm install --frozen-lockfile` + `tsc` +
   `build`, Node 22) y backend (`pip install` + `alembic upgrade head`
   + `pytest`, Python 3.12) contra un Postgres 16 real. El job del
   frontend usa `pnpm/action-setup` SIN `version:`: la versión la
   fija el `packageManager` de `package.json` (con `version:` el
   action falla con "Multiple versions of pnpm specified").
2. `backend/docker-compose.yml` (copia del repo backend) NO entra en
   la plantilla: el proyecto generado usa el compose de la raíz,
   igual que el camino 2.
3. `frontend/public/favicon.ico` excluido (binario): el `index.html`
   lo sigue referenciando y el README del template lo advierte; el
   directorio `public/` se conserva con un `.gitkeep`.
4. `frontend/pnpm-lock.yaml` INCLUIDO (el camino 3 migró de npm a
   pnpm en 2026-11-06, igual que la app de referencia): el lockfile
   de pnpm v9 no lleva el nombre del proyecto, así que entra tal cual
   (sus specifiers coinciden con el `package.json` del template) y
   `pnpm install --frozen-lockfile` funciona en el proyecto
   generado. `frontend/pnpm-workspace.yaml` también entra, con los
   `allowBuilds` del repo de referencia. `package-lock.json`
   ELIMINADO del template.
5. Puerto del frontend cableado en `angular.json`
   (`serve.options.port` = `{{FRONTEND_PORT}}`), como el camino 2 lo
   cablea en `vite.config.ts`: sin eso `--frontend-port` solo
   cambiaría el README y el CORS, no el `ng serve`.
6. Título de FastAPI: `"Buildora camino 3 API"` →
   `"{{PROJECT_TITLE}} API"`, igual que el camino 2.
7. Marca "Buildora" en la UI (brand del header, título, footer,
   subtítulo del login, spec) → `{{PROJECT_TITLE}}` o texto neutro,
   igual que el camino 2.
8. `app.db`, `__pycache__/`, `.venv/`, `dist/`, `.angular/` y
   `node_modules/` excluidos; el generador además ignora `.venv`,
   `__pycache__`, `dist` y `node_modules` aunque aparezcan.

## Verificación 0.3.0 (2026-11-06, camino 3)

- Generador: `prueba-angular` (angular-fastapi, defaults) = 68 archivos
  (67 antes de la migración a pnpm: − `package-lock.json` +
  `pnpm-lock.yaml` + `pnpm-workspace.yaml`); `mi-tienda-tres`
  (angular-fastapi, flags personalizados: título, puertos 4300/8001,
  db `mi_tienda_x`) = 67 archivos en la verificación original, 68 tras
  la migración; `prueba-nest` (next-nest, defaults) = 109 archivos,
  igual que en 0.2.0; `prueba-django` (react-django, defaults) = 47
  archivos, igual que en 0.2.0. Cero `{{...}}` sobrantes y cero strings
  personales en los tres (única mención de "Buildora" = la línea de
  procedencia en el README generado). `--stack foo` → exit 1 con la
  lista de disponibles. `--version` = 0.3.0, `--help` con los tres
  stacks.
- Camino 3 generado: frontend `pnpm install --frozen-lockfile` limpio
  (lockfile en sync), `pnpm exec tsc --noEmit` 0 errores, `pnpm run
  build` verde, `ng test` 2 passed, `ng serve` en :4200 (socket
  `[::1]:4200`; en esta VM `127.0.0.1` no responde porque el dev server
  escucha solo IPv6 ::1 — `localhost` sí responde 200; título y marca
  "Prueba Angular" verificados en vivo). Backend `pip install` limpio,
  `pytest` 20 tests OK (SQLite), `alembic upgrade head` OK en SQLite.
  Pruebas con `DATABASE_ENGINE=sqlite`; la prueba real contra Postgres
  queda para el CI tras el push, igual que con la referencia.
- `npm pack`: tarball 230 archivos = 68 (angular-fastapi) + 109
  (next-nest) + 47 (react-django) + bin + 2 scripts + package.json +
  README + LICENSE. Cero `.gitignore` en el tarball y 9 `gitignore`
  (sin punto) presentes, 3 de ellos del camino 3. El CI combinado del
  camino 3 (`templates/angular-fastapi/.github/workflows/ci.yml`) SÍ
  entra en el tarball y en el proyecto generado, con los tokens de
  Postgres reemplazados. El tarball lleva `pnpm-lock.yaml` y
  `pnpm-workspace.yaml` del camino 3 y cero `package-lock.json` en
  total (ningún stack lleva ya uno).
