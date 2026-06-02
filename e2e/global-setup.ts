/**
 * Global setup E2E — Green Sol
 *
 * Salvaguarda: aborta si DATABASE_URL no es greensol_test.
 * Migra la base de test, limpia @test.local y siembra qa@greensol.local.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { hashContrasena } from "../lib/auth/password";

// Contraseña del super-admin QA en la base de test. La usa el smoke de gestión
// y el flujo KYC (confirmación de aprobación con credencial).
const QA_CLAVE = "GreenSolQA2026!";

// ─── Salvaguarda CRÍTICA ──────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.includes("greensol_test")) {
  throw new Error(
    "E2E debe correr contra greensol_test — usa npm run test:e2e"
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function limpiarTestLocal(prisma: PrismaClient) {
  const usuarios = await prisma.usuario.findMany({
    where: { correo: { endsWith: "@test.local" } },
    select: { id: true },
  });
  if (usuarios.length === 0) return;
  const ids = usuarios.map((u) => u.id);

  // Orden: dependientes primero; cascade cubre Sesion/CodigoOtp/Notificacion/MetodoPago/VerificacionKyc
  await prisma.valoracion.deleteMany({
    where: { OR: [{ deUsuarioId: { in: ids } }, { aUsuarioId: { in: ids } }] },
  });
  await prisma.participante.deleteMany({ where: { usuarioId: { in: ids } } });
  await prisma.recolecta.deleteMany({ where: { organizadorId: { in: ids } } });
  await prisma.usuario.deleteMany({ where: { id: { in: ids } } });

  console.log(`[setup] Limpiados ${ids.length} usuario(s) @test.local.`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default async function globalSetup() {
  // 1. Asegurar que la base de test está migrada
  console.log("[setup] Aplicando migraciones en greensol_test…");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: process.env,
  });

  // Instancia nueva que lee DATABASE_URL del env (no usa el singleton de @/lib/db)
  const prisma = new PrismaClient();

  // 2. Limpiar residuos de runs anteriores
  await limpiarTestLocal(prisma);

  // 3. Sembrar super-admin de QA (smoke test seed-admin lo busca; el flujo KYC
  //    confirma la aprobación con su contraseña).
  const claveHash = await hashContrasena(QA_CLAVE);
  await prisma.usuario.upsert({
    where: { correo: "qa@greensol.local" },
    create: {
      correo: "qa@greensol.local",
      nombre: "QA Admin",
      rol: "super_admin",
      correoVerificado: true,
      hashContrasena: claveHash,
    },
    update: {
      rol: "super_admin",
      correoVerificado: true,
      hashContrasena: claveHash,
    },
  });

  console.log("[setup] Super-admin QA (qa@greensol.local) listo.");

  await prisma.$disconnect();
}
