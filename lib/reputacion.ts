import { prisma } from "@/lib/db";

export type Reputacion = {
  positivos: number;
  negativos: number;
  total: number;
  estrellas: number; // 0–5
};

/** Reputación de un usuario a partir de sus valoraciones recibidas. */
export async function obtenerReputacion(
  usuarioId: string,
): Promise<Reputacion> {
  const valoraciones = await prisma.valoracion.findMany({
    where: { aUsuarioId: usuarioId },
  });
  const positivos = valoraciones.filter((v) => v.voto > 0).length;
  const negativos = valoraciones.filter((v) => v.voto < 0).length;
  const total = positivos + negativos;
  const estrellas =
    total === 0 ? 0 : Math.round((positivos / total) * 5 * 10) / 10;
  return { positivos, negativos, total, estrellas };
}
