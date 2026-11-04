#!/usr/bin/env node
/**
 * CLI `buildora` — genera un proyecto desde una plantilla de Buildora.
 *
 *   buildora generate <nombre-kebab> [directorio-salida] [opciones]
 *   buildora --help
 *   buildora --version
 *
 * Sin directorio de salida, el proyecto se crea en el directorio actual
 * (<cwd>/<nombre-kebab>). La plantilla se resuelve desde la ubicación
 * del paquete (scripts/lib/generate.mjs), nunca desde el cwd, así que
 * funciona igual instalado globalmente con npm que desde un clon.
 *
 * Cero dependencias: solo node:fs, node:path y node:url.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AVAILABLE_STACKS,
  generateProject,
  printNextSteps,
  validateStack,
} from "../scripts/lib/generate.mjs";

const BIN_DIR = dirname(fileURLToPath(import.meta.url));

function readVersion() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(BIN_DIR, "..", "package.json"), "utf-8")
    );
    return pkg.version ?? "0.2.0";
  } catch {
    return "0.2.0";
  }
}

function usage() {
  return [
    "Uso: buildora <comando> [opciones]",
    "",
    "Comandos:",
    "  generate <nombre-kebab> [directorio-salida] [opciones]  Genera un proyecto desde una plantilla",
    "",
    "Opciones de generate:",
    "  --stack next-nest|react-django  Stack a generar (por defecto: next-nest)",
    '  --title "Mi Tienda"   Título (por defecto: derivado del nombre)',
    '  --description "..."   Descripción (por defecto: genérica del stack)',
    "  --frontend-port N     Puerto del frontend (next-nest: 3000; react-django: 5173)",
    "  --backend-port N      Puerto del backend (next-nest: 3001; react-django: 8000)",
    "  --db-user X           Usuario Postgres (por defecto: nombre en snake_case)",
    "  --db-name X           Base Postgres (por defecto: nombre en snake_case)",
    "  --force               Sobrescribe el directorio de salida si existe",
    "",
    "Otras opciones:",
    "  --help, -h              Muestra esta ayuda",
    "  --version, -v           Muestra la versión",
    "",
    `Stacks disponibles: ${AVAILABLE_STACKS.join(", ")}`,
    "",
    "Ejemplos:",
    "  npx buildora generate mi-proyecto --stack next-nest",
    "  npx buildora generate mi-proyecto --stack react-django",
    '  buildora generate mi-tienda ./salida --title "Mi Tienda"',
  ].join("\n");
}

function fail(message) {
  console.error(`Error: ${message}\n\n${usage()}`);
  process.exit(1);
}

const KNOWN_FLAGS = new Set([
  "stack",
  "title",
  "description",
  "frontend-port",
  "backend-port",
  "db-user",
  "db-name",
]);

function parseGenerateArgs(argv) {
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
      if (!KNOWN_FLAGS.has(key)) {
        fail(
          `opción desconocida: ${arg} (opciones válidas: ${[...KNOWN_FLAGS].map((f) => `--${f}`).join(", ")}, --force, --help)`
        );
      }
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
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;

  if (command === undefined || command === "--help" || command === "-h") {
    console.log(usage());
    process.exit(0);
  }
  if (command === "--version" || command === "-v") {
    console.log(readVersion());
    process.exit(0);
  }
  if (command !== "generate") {
    fail(`comando desconocido: ${command} (comandos válidos: generate)`);
  }

  const { positionals, opts } = parseGenerateArgs(rest);
  const [name, outputArg] = positionals;
  if (!name) fail("falta el nombre del proyecto en kebab-case");
  if (positionals.length > 2) fail("demasiados argumentos posicionales");

  try {
    validateStack(opts.stack ?? "next-nest");
  } catch (err) {
    fail(err.message);
  }

  const outputDir = outputArg
    ? resolve(process.cwd(), outputArg)
    : resolve(process.cwd(), name);
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
