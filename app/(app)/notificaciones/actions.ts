"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";

export async function marcarTodasLeidas(): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  await prisma.notificacion.updateMany({
    where: { usuarioId: usuario.id, leida: false },
    data: { leida: true },
  });
  revalidatePath("/notificaciones");
}
