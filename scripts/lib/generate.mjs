/**
 * Núcleo de generación de Buildora (cero dependencias).
 *
 * Lo usan tanto `scripts/generate.mjs` (uso desde un clon del repo)
 * como `bin/buildora.mjs` (paquete npm instalado). Por eso la
 * plantilla se resuelve desde la ubicación de ESTE módulo
 * (import.meta.url → raíz del paquete → templates/<stack>/), NUNCA desde
 * process.cwd(): así funciona igual en un checkout y en una
 * instalación global de npm.
 *
 * Esta función NO termina el proceso: lanza Error y cada CLI
 * decide cómo mostrarlo (uso + exit 1).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = join(LIB_DIR, "..", "..");
export const TEMPLATES_DIR = join(PACKAGE_ROOT, "templates");

/** Stacks que el generador sabe construir hoy. */
export const AVAILABLE_STACKS = ["next-nest", "react-django"];

/** Directorio de la plantilla de un stack. */
export function templateDirFor(stack) {
  return join(TEMPLATES_DIR, stack);
}

/** Defaults por stack: puertos y descripción genérica. */
export const STACK_DEFAULTS = {
  "next-nest": {
    frontendPort: "3000",
    backendPort: "3001",
    description:
      "Aplicación full-stack (Next.js + NestJS + Prisma + PostgreSQL + Redis + auth + Docker + CI)",
  },
  "react-django": {
    frontendPort: "5173",
    backendPort: "8000",
    description:
      "Aplicación full-stack (React + Vite + Django + DRF + PostgreSQL + Redis + auth + Docker + CI)",
  },
};

const BINARY_EXTS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".zip",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "coverage",
  ".vercel",
  ".git",
  ".venv",
  "__pycache__",
]);
const SKIP_FILES = new Set([
  "db.sqlite3",
]);
export const KEBAB_RE = /^[a-z][a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toTitle(kebab) {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function toSnake(kebab) {
  return kebab.replace(/-/g, "_");
}

/** Lanza Error si el stack no está en AVAILABLE_STACKS. */
export function validateStack(stack) {
  if (!AVAILABLE_STACKS.includes(stack)) {
    throw new Error(
      `stack desconocido: "${stack}". Stacks disponibles: ${AVAILABLE_STACKS.join(", ")}`
    );
  }
}

export function parsePort(value, flag) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(`${flag} debe ser un puerto válido (1-65535), recibido: ${value}`);
  }
  return String(n);
}

function isRealEnvFile(name) {
  return name === ".env" || (name.startsWith(".env.") && name !== ".env.example");
}

function isBinary(name) {
  const dot = name.lastIndexOf(".");
  return dot !== -1 && BINARY_EXTS.has(name.slice(dot).toLowerCase());
}

function replaceTokens(text, vars) {
  let out = text;
  for (const [token, value] of Object.entries(vars)) {
    out = out.split(token).join(value);
  }
  return out;
}

function copyTree(src, dest, vars, stats) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      copyTree(join(src, entry.name), join(dest, entry.name), vars, stats);
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name === ".DS_Store") continue;
    if (SKIP_FILES.has(entry.name)) continue;
    if (entry.name.endsWith(".tsbuildinfo")) continue;
    if (entry.name === "next-env.d.ts") continue;
    if (isRealEnvFile(entry.name)) continue;
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (isBinary(entry.name)) {
      cpSync(srcPath, destPath);
    } else {
      let text;
      try {
        text = readFileSync(srcPath, "utf-8");
      } catch {
        cpSync(srcPath, destPath);
        stats.files++;
        continue;
      }
      writeFileSync(destPath, replaceTokens(text, vars), "utf-8");
    }
    stats.files++;
  }
}

/**
 * Renombra los archivos `gitignore` (sin punto) a `.gitignore`.
 *
 * Por qué: npm excluye del tarball cualquier archivo llamado
 * `.gitignore` (lo trata como archivo de reglas, ni las negaciones en
 * .npmignore lo re-incluyen — verificado con npm pack). La plantilla
 * guarda esos archivos como `gitignore` y el generador les devuelve
 * el punto al generar. Sin este paso, los proyectos generados desde
 * el paquete npm saldrían sin .gitignore.
 */
function renameGitignores(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      renameGitignores(path);
      continue;
    }
    if (entry.isFile() && entry.name === "gitignore") {
      renameSync(path, join(dir, ".gitignore"));
    }
  }
}

function renamePlaceholders(dir, vars) {
  // De lo más profundo a lo más superficial para no romper rutas.
  const entries = [];
  const walk = (d, depth) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      entries.push({ path: join(d, entry.name), name: entry.name, depth, isDir: entry.isDirectory() });
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) walk(join(d, entry.name), depth + 1);
    }
  };
  walk(dir, 0);
  entries.sort((a, b) => b.depth - a.depth);
  for (const entry of entries) {
    if (!entry.name.includes("{{")) continue;
    const newName = replaceTokens(entry.name, vars);
    renameSync(entry.path, join(dirname(entry.path), newName));
  }
}

/**
 * Genera un proyecto desde la plantilla.
 *
 * @param {object} args
 * @param {string} args.name           Nombre en kebab-case (obligatorio)
 * @param {string} [args.stack]        Stack (por defecto: "next-nest")
 * @param {string} [args.title]        Título (por defecto: derivado del nombre)
 * @param {string} [args.description]  Descripción (por defecto: genérica del stack)
 * @param {string} [args.frontendPort] Puerto frontend (por defecto: el del stack)
 * @param {string} [args.backendPort]  Puerto backend (por defecto: el del stack)
 * @param {string} [args.dbUser]       Usuario Postgres (por defecto: nombre en snake_case)
 * @param {string} [args.dbName]       Base Postgres (por defecto: nombre en snake_case)
 * @param {string} args.outputDir      Directorio de salida ABSOLUTO (lo resuelve el llamador)
 * @param {boolean} [args.force]       Sobrescribe el directorio si no está vacío
 * @returns {{ name: string, stack: string, title: string, outputDir: string, files: number, vars: Record<string, string> }}
 */
export function generateProject(args) {
  const { name } = args;
  if (!name) {
    throw new Error("falta el nombre del proyecto en kebab-case");
  }
  if (!KEBAB_RE.test(name)) {
    throw new Error(
      `el nombre debe ser kebab-case (minúsculas, números y guiones, empezando por letra): ${name}`
    );
  }

  const stack = args.stack ?? "next-nest";
  validateStack(stack);
  const defaults = STACK_DEFAULTS[stack];

  const title = args.title ?? toTitle(name);
  const snake = toSnake(name);
  const vars = {
    "{{PROJECT_NAME}}": name,
    "{{PROJECT_TITLE}}": title,
    "{{PROJECT_DESCRIPTION}}": args.description ?? defaults.description,
    "{{FRONTEND_PORT}}": args.frontendPort
      ? parsePort(args.frontendPort, "--frontend-port")
      : defaults.frontendPort,
    "{{BACKEND_PORT}}": args.backendPort
      ? parsePort(args.backendPort, "--backend-port")
      : defaults.backendPort,
    "{{POSTGRES_USER}}": args.dbUser ?? snake,
    "{{POSTGRES_DB}}": args.dbName ?? snake,
  };

  const templateDir = templateDirFor(stack);
  if (!existsSync(templateDir)) {
    throw new Error(`no se encontró el directorio de la plantilla: ${templateDir}`);
  }

  const outputDir = args.outputDir;
  if (!outputDir) {
    throw new Error("falta el directorio de salida (error interno del llamador)");
  }
  if (existsSync(outputDir)) {
    const st = statSync(outputDir);
    if (!st.isDirectory()) {
      throw new Error(`la salida existe y no es un directorio: ${outputDir}`);
    }
    if (readdirSync(outputDir).length > 0) {
      if (!args.force) {
        throw new Error(
          `el directorio de salida ya existe y no está vacío: ${outputDir} (usa --force para sobrescribir)`
        );
      }
      rmSync(outputDir, { recursive: true, force: true });
    }
  }

  const stats = { files: 0 };
  copyTree(templateDir, outputDir, vars, stats);
  renamePlaceholders(outputDir, vars);
  renameGitignores(outputDir);

  return { name, stack, title, outputDir, files: stats.files, vars };
}

/** Imprime el resumen y los próximos pasos (por stack). */
export function printNextSteps(result) {
  const { name, stack, title, outputDir, files, vars } = result;
  const displayDir =
    outputDir.startsWith(process.cwd() + sep) || outputDir === process.cwd()
      ? relative(process.cwd(), outputDir) || "."
      : outputDir;
  console.log(`\nListo: proyecto "${name}" (${stack}) generado en ${displayDir} (${files} archivos).`);
  console.log(`  Nombre: ${name} | Título: ${title} | DB: ${vars["{{POSTGRES_DB}}"]} / usuario ${vars["{{POSTGRES_USER}}"]}`);
  console.log("\nPróximos pasos:");
  console.log(`  cd ${displayDir}`);
  if (stack === "react-django") {
    console.log("  cp .env.example .env");
    console.log("  cp backend/.env.example backend/.env");
    console.log("  # Edita ambos .env: cambia POSTGRES_PASSWORD (la misma en los dos).");
    console.log("  docker compose up -d");
    console.log("  cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python manage.py migrate && cd ..");
    console.log(`  cd frontend && pnpm install && pnpm dev   # http://localhost:${vars["{{FRONTEND_PORT}}"]}`);
    console.log(`  cd backend && python manage.py runserver   # http://localhost:${vars["{{BACKEND_PORT}}"]} (con el venv activado)`);
    console.log("  Verificación: frontend: pnpm typecheck && pnpm build | backend: python manage.py check && python manage.py test");
    return;
  }
  const frontendDev =
    vars["{{FRONTEND_PORT}}"] === "3000" ? "pnpm dev" : `pnpm dev -- -p ${vars["{{FRONTEND_PORT}}"]}`;
  console.log("  cp frontend/.env.example frontend/.env.local");
  console.log("  cp backend/.env.example backend/.env");
  console.log("  cp backend/src/shared/database/.env.example backend/src/shared/database/.env");
  console.log("  # Edita backend/.env: cambia POSTGRES_PASSWORD, DATABASE_URL y los secretos JWT.");
  console.log("  # Los dos .env del backend deben tener la MISMA DATABASE_URL.");
  console.log("  cd backend && docker compose up -d && cd ..");
  console.log("  cd frontend && pnpm install && cd .. && cd backend && pnpm install && cd ..");
  console.log("  cd backend && pnpm exec prisma generate --schema src/shared/database/prisma/schema.prisma");
  console.log("  cd backend && pnpm exec prisma migrate dev && cd ..");
  console.log(`  cd frontend && ${frontendDev}   # http://localhost:${vars["{{FRONTEND_PORT}}"]}`);
  console.log(`  cd backend && pnpm start:dev   # http://localhost:${vars["{{BACKEND_PORT}}"]}`);
  console.log("  Verificación: frontend: pnpm typecheck && pnpm build | backend: pnpm build");
}
