/**
 * Global setup E2E — Green Sol
 *
 * Borra TODOS los usuarios @test.local y sus dependientes antes de la suite.
 * Nunca toca qa@greensol.local ni luisitoys@gmail.com.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function limpiarTestLocal() {
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

export default async function globalSetup() {
  await limpiarTestLocal();
  await prisma.$disconnect();
}
