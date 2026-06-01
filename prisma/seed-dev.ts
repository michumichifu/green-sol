/**
 * Seed de desarrollo: crea un usuario super-admin de pruebas para QA local.
 * Idempotente (upsert por correo). NO usar en producción.
 *
 *   npm run seed:dev
 *
 * Credenciales (también en _privado/, no al repo):
 *   correo: qa@greensol.local
 *   clave:  GreenSolQA2026!
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  const correo = "qa@greensol.local";
  const hashContrasena = await hash("GreenSolQA2026!");
  const datos = {
    hashContrasena,
    rol: "super_admin" as const,
    correoVerificado: true,
    nombre: "QA",
    apellido: "GreenSol",
    nombreUsuario: "qa_greensol",
    pais: "VE",
  };
  const u = await prisma.usuario.upsert({
    where: { correo },
    create: { correo, ...datos },
    update: datos,
  });
  console.log(`Usuario QA listo: ${u.correo} (rol ${u.rol}, id ${u.id})`);
  console.log("Clave: GreenSolQA2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
