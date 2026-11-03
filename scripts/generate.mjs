#!/usr/bin/env node
/**
 * Genera un proyecto desde la plantilla del camino dorado 1.
 *
 * Uso:
 *   node scripts/generate.mjs <nombre-kebab> [directorio-salida] [opciones]
 *
 * Opciones:
 *   --title "Mi Tienda"        Título (por defecto: derivado del nombre)
 *   --description "..."        Descripción (por defecto: genérica del stack)
 *   --frontend-port 3000       Puerto del frontend (por defecto: 3000)
 *   --backend-port 3001        Puerto del backend (por defecto: 3001)
 *   --db-user mi_tienda        Usuario Postgres (por defecto: nombre en snake_case)
 *   --db-name mi_tienda        Base Postgres (por defecto: nombre en snake_case)
 *   --force                    Sobrescribe el directorio de salida si existe
 *
 * Sin directorio de salida, el proyecto se crea como hermano del
 * repositorio de la plantilla (../<nombre-kebab>).
 *
 * Cero dependencias: solo node:fs, node:path y node:url.
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

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(SCRIPT_DIR, "..", "template");

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
]);
const KEBAB_RE = /^[a-z][a-z0-9]+(?:-[a-z0-9]+)*$/;

function usage() {
  return [
    "Uso: node scripts/generate.mjs <nombre-kebab> [directorio-salida] [opciones]",
    "",
    "  <nombre-kebab>     Nombre del proyecto en kebab-case (p. ej. mi-tienda)",
    "  [directorio-salida]  Donde crear el proyecto (por defecto: ../<nombre-kebab>)",
    "",
    "Opciones:",
    '  --title "Mi Tienda"   Título (por defecto: derivado del nombre)',
    '  --description "..."   Descripción (por defecto: genérica del stack)',
    "  --frontend-port N     Puerto del frontend (por defecto: 3000)",
    "  --backend-port N      Puerto del backend (por defecto: 3001)",
    "  --db-user X           Usuario Postgres (por defecto: nombre en snake_case)",
    "  --db-name X           Base Postgres (por defecto: nombre en snake_case)",
    "  --force               Sobrescribe el directorio de salida si existe",
  ].join("\n");
}

function fail(message) {
  console.error(`Error: ${message}\n\n${usage()}`);
  process.exit(1);
}

function toTitle(kebab) {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toSnake(kebab) {
  return kebab.replace(/-/g, "_");
}

function parseArgs(argv) {
  const positionals = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") {
      opts.force = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        fail(`la opción ${arg} necesita un valor`);
      }
      opts[key] = value;
      i++;
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, opts };
}

function parsePort(value, flag) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    fail(`${flag} debe ser un puerto válido (1-65535), recibido: ${value}`);
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

function main() {
  const { positionals, opts } = parseArgs(process.argv.slice(2));
  const [name, outputArg] = positionals;
  if (!name) fail("falta el nombre del proyecto en kebab-case");
  if (positionals.length > 2) fail("demasiados argumentos posicionales");
  if (!KEBAB_RE.test(name)) {
    fail(`el nombre debe ser kebab-case (minúsculas, números y guiones, empezando por letra): ${name}`);
  }

  const title = opts.title ?? toTitle(name);
  const snake = toSnake(name);
  const vars = {
    "{{PROJECT_NAME}}": name,
    "{{PROJECT_TITLE}}": title,
    "{{PROJECT_DESCRIPTION}}":
      opts.description ??
      "Aplicación full-stack (Next.js + NestJS + Prisma + PostgreSQL + Redis + auth + Docker + CI)",
    "{{FRONTEND_PORT}}": opts["frontend-port"] ? parsePort(opts["frontend-port"], "--frontend-port") : "3000",
    "{{BACKEND_PORT}}": opts["backend-port"] ? parsePort(opts["backend-port"], "--backend-port") : "3001",
    "{{POSTGRES_USER}}": opts["db-user"] ?? snake,
    "{{POSTGRES_DB}}": opts["db-name"] ?? snake,
  };

  if (!existsSync(TEMPLATE_DIR)) {
    fail(`no se encontró el directorio de la plantilla: ${TEMPLATE_DIR}`);
  }

  const outputDir = outputArg
    ? resolve(process.cwd(), outputArg)
    : resolve(SCRIPT_DIR, "..", name);
  if (existsSync(outputDir)) {
    const st = statSync(outputDir);
    if (!st.isDirectory()) fail(`la salida existe y no es un directorio: ${outputDir}`);
    if (readdirSync(outputDir).length > 0) {
      if (!opts.force) {
        fail(`el directorio de salida ya existe y no está vacío: ${outputDir} (usa --force para sobrescribir)`);
      }
      rmSync(outputDir, { recursive: true, force: true });
    }
  }

  const stats = { files: 0 };
  copyTree(TEMPLATE_DIR, outputDir, vars, stats);
  renamePlaceholders(outputDir, vars);

  const displayDir =
    outputDir.startsWith(process.cwd() + sep) || outputDir === process.cwd()
      ? relative(process.cwd(), outputDir) || "."
      : outputDir;
  const frontendDev =
    vars["{{FRONTEND_PORT}}"] === "3000" ? "pnpm dev" : `pnpm dev -- -p ${vars["{{FRONTEND_PORT}}"]}`;
  console.log(`\nListo: proyecto "${name}" generado en ${displayDir} (${stats.files} archivos).`);
  console.log(`  Nombre: ${name} | Título: ${title} | DB: ${vars["{{POSTGRES_DB}}"]} / usuario ${vars["{{POSTGRES_USER}}"]}`);
  console.log("\nPróximos pasos:");
  console.log(`  cd ${displayDir}`);
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

main();
