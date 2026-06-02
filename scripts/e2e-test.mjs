/**
 * scripts/e2e-test.mjs
 *
 * Wrapper para tests E2E de Green Sol.
 * Deriva la DATABASE_URL de test desde .env (NO hardcodea credenciales),
 * sustituye la base por greensol_test, y spawnea Playwright en ese contexto.
 *
 * Uso: node scripts/e2e-test.mjs [args extra de playwright]
 */

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// --- Leer DATABASE_URL desde .env (sin dependencias externas) ---------------
function readDotEnv(envPath) {
  let content;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    throw new Error(`No se encontró .env en ${envPath}`);
  }
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DATABASE_URL")) {
      // Soporta DATABASE_URL="..." y DATABASE_URL=...
      const eqIdx = trimmed.indexOf("=");
      let val = trimmed.slice(eqIdx + 1).trim();
      // Quitar comillas externas si las hay
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val;
    }
  }
  throw new Error("DATABASE_URL no encontrada en .env");
}

// --- Derivar URL de test reemplazando el nombre de la base ------------------
function deriveTestUrl(devUrl) {
  // Caso: .../greensol?schema=...  →  .../greensol_test?schema=...
  if (devUrl.includes("/greensol?")) {
    return devUrl.replace("/greensol?", "/greensol_test?");
  }
  // Caso: .../greensol (sin query string)
  if (devUrl.endsWith("/greensol")) {
    return devUrl.replace(/\/greensol$/, "/greensol_test");
  }
  // Caso genérico: reemplazar el segmento de base antes del primer ?
  const [base, qs] = devUrl.split("?");
  const lastSlash = base.lastIndexOf("/");
  const dbName = base.slice(lastSlash + 1);
  const testBase = base.slice(0, lastSlash + 1) + dbName + "_test";
  return qs ? `${testBase}?${qs}` : testBase;
}

// --- Main -------------------------------------------------------------------
const envPath = resolve(rootDir, ".env");
const devUrl = readDotEnv(envPath);
const testUrl = deriveTestUrl(devUrl);

console.log("E2E contra greensol_test (puerto 3100)");
console.log(`  DATABASE_URL de test: ${testUrl.replace(/:([^:@]+)@/, ":***@")}`);

const env = {
  ...process.env,
  DATABASE_URL: testUrl,
  // Indica a next.config.ts que use distDir=".next-test" para no entrar en
  // conflicto con el lock del dev server (puerto 3000) que usa ".next".
  NEXT_E2E_BUILD: "1",
};

const extraArgs = process.argv.slice(2);
const playwrightCmd = ["npx", "playwright", "test", ...extraArgs].join(" ");

const child = spawn(playwrightCmd, {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
  env,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("Error al ejecutar playwright:", err);
  process.exit(1);
});
