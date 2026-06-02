/**
 * Global teardown E2E — Green Sol
 *
 * Salvaguarda: si DATABASE_URL no es greensol_test, no hace nada (no aborta).
 * Borra TODOS los usuarios @test.local y sus dependientes después de la suite.
 * Nunca toca qa@greensol.local ni luisitoys@gmail.com.
 */
import { PrismaClient } from "@prisma/client";

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

  console.log(`[teardown] Limpiados ${ids.length} usuario(s) @test.local.`);
}

export default async function globalTeardown() {
  // Salvaguarda: si alguien corrió playwright directo (sin el wrapper),
  // no limpiar nada para no tocar una base que no sea greensol_test.
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.includes("greensol_test")) {
    console.warn(
      "[teardown] DATABASE_URL no apunta a greensol_test — teardown omitido."
    );
    return;
  }

  // Instancia nueva que lee DATABASE_URL del env (no usa el singleton de @/lib/db)
  const prisma = new PrismaClient();
  await limpiarTestLocal(prisma);
  await prisma.$disconnect();
}
