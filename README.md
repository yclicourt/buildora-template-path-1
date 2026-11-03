# Plantilla camino dorado 1 de Buildora

Copia parametrizada del camino dorado 1 real (frontend Next.js +
backend NestJS, ambos repositorios públicos de Buildora), lista para
generar una aplicación full-stack que corre. **No es un motor
generador general**: es la aplicación camino 1 con los valores propios
de Buildora sustituidos por variables.

## Contenido

```text
template/              La aplicación (frontend/ + backend/ + CI + README del proyecto)
scripts/generate.mjs   Generador desde un clon (usa scripts/lib/generate.mjs)
scripts/lib/generate.mjs  Núcleo de generación (compartido con el CLI)
bin/buildora.mjs       CLI `buildora` (paquete npm, cero dependencias)
package.json           Paquete npm `buildora` (bin + files)
```

## CLI (npm): `buildora`

Sin clonar el repo:

```bash
npx buildora generate mi-proyecto --stack next-nest
# o instalado global:
npm install -g buildora
buildora generate mi-proyecto --stack next-nest
```

Opciones de `buildora generate`:

| Opción | Valor |
| --- | --- |
| `--stack` | Stack a generar (por defecto: `next-nest`) |
| `--title` | Título (por defecto: derivado del nombre) |
| `--description` | Descripción (por defecto: genérica del stack) |
| `--frontend-port` | Puerto del frontend (por defecto: `3000`) |
| `--backend-port` | Puerto del backend (por defecto: `3001`) |
| `--db-user` | Usuario Postgres (por defecto: nombre en snake_case) |
| `--db-name` | Base Postgres (por defecto: nombre en snake_case) |
| `--force` | Sobrescribe el directorio de salida si no está vacío |

Nota sobre `--stack`: hoy solo existe `next-nest`; cualquier otro
valor falla con la lista de stacks disponibles. El camino 2
(React + Vite + Django) añadirá su stack cuando esté listo. Sin
directorio de salida, el CLI crea el proyecto en el directorio actual
(`./<nombre-kebab>`); la plantilla se resuelve desde la ubicación del
paquete, así que funciona igual instalado globalmente que con `npx`.

## Variables

| Variable | Valor |
| --- | --- |
| `{{PROJECT_NAME}}` | Nombre en kebab-case que pasas al generador (`mi-tienda`) |
| `{{PROJECT_TITLE}}` | Derivado del nombre (`Mi Tienda`), o `--title` explícito |
| `{{PROJECT_DESCRIPTION}}` | Genérica del stack, o `--description` explícita |
| `{{FRONTEND_PORT}}` | `3000` por defecto (`--frontend-port`) |
| `{{BACKEND_PORT}}` | `3001` por defecto (`--backend-port`) |
| `{{POSTGRES_USER}}` | Nombre en snake_case (`mi_tienda`), o `--db-user` |
| `{{POSTGRES_DB}}` | Nombre en snake_case (`mi_tienda`), o `--db-name` |

La contraseña de Postgres NO es variable: los `.env.example` traen
`cambia-esta-clave` y el usuario la cambia junto con `DATABASE_URL`
(ver `template/README.md`).

## Generar un proyecto (desde un clon del repo)

```bash
node scripts/generate.mjs mi-tienda
# Sin directorio de salida, crea mi-tienda dentro del repo.

node scripts/generate.mjs mi-tienda /ruta/salida --title "Mi Tienda" --force
```

El generador copia `template/`, sustituye todas las variables en los
archivos de texto (los binarios se copian tal cual), renombra
archivos/directorios que contengan variables e imprime los pasos
siguientes concretos. Se niega a sobrescribir un directorio no vacío
salvo que pases `--force`.

## Correr el proyecto generado

Resumen (el detalle completo está en `template/README.md`):

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

## Gotchas documentados (vienen del proyecto real)

1. **Dos `.env`, dos lectores.** La app NestJS lee `backend/.env`;
   Prisma (migrate/generate) lee `backend/src/shared/database/.env`.
   Los dos deben tener la MISMA `DATABASE_URL`.
2. **Volumen de Postgres.** El entrypoint solo crea `POSTGRES_USER`
   en la primera inicialización de un volumen VACÍO. Si cambias el
   usuario/base con un volumen ya existente, hay que hacer
   `docker compose down -v` (borra los datos; solo en desarrollo).
3. **pnpm 11 y los scripts de build.** Cada `pnpm-workspace.yaml`
   lleva las DOS claves: `allowBuilds` (pnpm 11) y
   `onlyBuiltDependencies` (pnpm 10). pnpm 11 ELIMINÓ
   `onlyBuiltDependencies` y la ignora en silencio; sin `allowBuilds`,
   el install falla con `ERR_PNPM_IGNORED_BUILDS`.
4. **Prisma en esta VM.** Las descargas de binarios de Prisma fallan
   por el proxy de egress de esta VM; el build del backend puede no
   completarse aquí aunque el código esté bien. En CI y en la máquina
   del desarrollador (con red normal) funciona.
5. **Redis.** Está en `docker-compose.yml` listo para usar, pero el
   código de la app todavía no lo usa (caché/colas futuras).

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
