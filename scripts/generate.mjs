#!/usr/bin/env node
/**
 * Genera un proyecto desde una plantilla de Buildora.
 * Uso desde un clon del repo (la lógica vive en scripts/lib/generate.mjs,
 * compartida con el CLI `buildora` del paquete npm):
 *
 *   node scripts/generate.mjs <nombre-kebab> [directorio-salida] [opciones]
 *
 * Opciones:
 *   --stack next-nest|react-django|angular-fastapi  Stack a generar (por defecto: next-nest)
 *   --title "Mi Tienda"        Título (por defecto: derivado del nombre)
 *   --description "..."        Descripción (por defecto: genérica del stack)
 *   --frontend-port 3000       Puerto del frontend (next-nest: 3000; react-django: 5173; angular-fastapi: 4200)
 *   --backend-port 3001        Puerto del backend (next-nest: 3001; react-django: 8000; angular-fastapi: 8000)
 *   --db-user mi_tienda        Usuario Postgres (por defecto: nombre en snake_case)
 *   --db-name mi_tienda        Base Postgres (por defecto: nombre en snake_case)
 *   --force                    Sobrescribe el directorio de salida si existe
 *
 * Sin directorio de salida, el proyecto se crea dentro del
 * repositorio de la plantilla (<repo>/<nombre-kebab>).
 *
 * Cero dependencias: solo node:fs, node:path y node:url.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, printNextSteps } from "./lib/generate.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

function usage() {
  return [
    "Uso: node scripts/generate.mjs <nombre-kebab> [directorio-salida] [opciones]",
    "",
    "  <nombre-kebab>     Nombre del proyecto en kebab-case (p. ej. mi-tienda)",
    "  [directorio-salida]  Donde crear el proyecto (por defecto: <repo>/<nombre-kebab>)",
    "",
    "Opciones:",
    "  --stack next-nest|react-django|angular-fastapi  Stack a generar (por defecto: next-nest)",
    '  --title "Mi Tienda"   Título (por defecto: derivado del nombre)',
    '  --description "..."   Descripción (por defecto: genérica del stack)',
    "  --frontend-port N     Puerto del frontend (next-nest: 3000; react-django: 5173; angular-fastapi: 4200)",
    "  --backend-port N      Puerto del backend (next-nest: 3001; react-django: 8000; angular-fastapi: 8000)",
    "  --db-user X           Usuario Postgres (por defecto: nombre en snake_case)",
    "  --db-name X           Base Postgres (por defecto: nombre en snake_case)",
    "  --force               Sobrescribe el directorio de salida si existe",
  ].join("\n");
}

function fail(message) {
  console.error(`Error: ${message}\n\n${usage()}`);
  process.exit(1);
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

function main() {
  const { positionals, opts } = parseArgs(process.argv.slice(2));
  const [name, outputArg] = positionals;
  if (!name) fail("falta el nombre del proyecto en kebab-case");
  if (positionals.length > 2) fail("demasiados argumentos posicionales");

  const outputDir = outputArg
    ? resolve(process.cwd(), outputArg)
    : resolve(SCRIPT_DIR, "..", name);
  try {
    const result = generateProject({
      name,
      stack: opts.stack ?? "next-nest",
      title: opts.title,
      description: opts.description,
      frontendPort: opts["frontend-port"],
      backendPort: opts["backend-port"],
      dbUser: opts["db-user"],
      dbName: opts["db-name"],
      outputDir,
      force: !!opts.force,
    });
    printNextSteps(result);
  } catch (err) {
    fail(err.message);
  }
}

main();
