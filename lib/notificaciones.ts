import { prisma } from "@/lib/db";

type BaseNoti = {
  tipo: string;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
};

/** Crea una notificación para un usuario (campanita). */
export async function crearNotificacion(
  usuarioId: string,
  base: BaseNoti,
): Promise<void> {
  await prisma.notificacion.create({ data: { usuarioId, ...base } });
}

/** Crea la misma notificación para varios usuarios. */
export async function notificarVarios(
  usuarioIds: string[],
  base: BaseNoti,
): Promise<void> {
  if (!usuarioIds.length) return;
  await prisma.notificacion.createMany({
    data: usuarioIds.map((usuarioId) => ({ usuarioId, ...base })),
  });
}

export async function contarNoLeidas(usuarioId: string): Promise<number> {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
}
