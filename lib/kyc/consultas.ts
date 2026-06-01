import { prisma } from "@/lib/db";
import type { VerificacionKyc } from "@prisma/client";

/** Última solicitud de verificación del usuario (la más reciente), o null. */
export async function ultimaVerificacion(
  usuarioId: string,
): Promise<VerificacionKyc | null> {
  return prisma.verificacionKyc.findFirst({
    where: { usuarioId },
    orderBy: { creadaEn: "desc" },
  });
}
