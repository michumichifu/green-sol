"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { crearRecolectaSchema } from "@/lib/validations/recolecta";

export type EstadoRecolecta = { error?: string };

export async function crearRecolecta(
  _estado: EstadoRecolecta,
  formData: FormData,
): Promise<EstadoRecolecta> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  const datos = crearRecolectaSchema.safeParse({
    tipo: formData.get("tipo"),
    nombre: formData.get("nombre"),
    visibilidad: formData.get("visibilidad"),
    monto: formData.get("monto"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { tipo, nombre, visibilidad, monto } = datos.data;

  const recolecta = await prisma.recolecta.create({
    data: {
      tipo,
      nombre,
      visibilidad,
      organizadorId: usuario.id,
      montoAporte: tipo === "san" ? monto : null,
      meta: tipo === "vaca" ? monto : null,
      participantes: { create: { usuarioId: usuario.id } },
    },
  });
  redirect(`/sanes/${recolecta.id}`);
}

export async function invitarPorCorreo(
  recolectaId: string,
  formData: FormData,
): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
  });
  if (!recolecta || recolecta.organizadorId !== usuario.id) return;

  const correo = String(formData.get("correo") ?? "")
    .trim()
    .toLowerCase();
  const invitado = await prisma.usuario.findUnique({ where: { correo } });
  if (!invitado) return;

  try {
    await prisma.participante.create({
      data: { recolectaId, usuarioId: invitado.id },
    });
    revalidatePath(`/sanes/${recolectaId}`);
  } catch {
    // ya estaba en la recolecta
  }
}

export async function generarTurnos(recolectaId: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
    include: { participantes: true, turnos: true },
  });
  if (
    !recolecta ||
    recolecta.organizadorId !== usuario.id ||
    recolecta.tipo !== "san" ||
    recolecta.turnos.length
  ) {
    return;
  }

  const mezclados = [...recolecta.participantes].sort(
    () => Math.random() - 0.5,
  );
  await prisma.$transaction([
    ...mezclados.map((p, i) =>
      prisma.turno.create({
        data: { recolectaId, participanteId: p.id, posicion: i + 1 },
      }),
    ),
    prisma.recolecta.update({
      where: { id: recolectaId },
      data: { estado: "activa" },
    }),
  ]);
  revalidatePath(`/sanes/${recolectaId}`);
}
