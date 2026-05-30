"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { crearRecolectaSchema } from "@/lib/validations/recolecta";
import { crearNotificacion, notificarVarios } from "@/lib/notificaciones";

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
    descripcion: formData.get("descripcion") || undefined,
    visibilidad: formData.get("visibilidad"),
    moneda: formData.get("moneda"),
    monto: formData.get("monto"),
    frecuencia: formData.get("frecuencia") || undefined,
    frecuenciaDias: formData.get("frecuenciaDias") || undefined,
    cupoMiembros: formData.get("cupoMiembros") || undefined,
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const {
    tipo,
    nombre,
    descripcion,
    visibilidad,
    moneda,
    monto,
    frecuencia,
    frecuenciaDias,
    cupoMiembros,
  } = datos.data;

  // En un san, `monto` es la meta por turno; el aporte por persona se reparte.
  const aportePorPersona =
    tipo === "san" && cupoMiembros ? monto / cupoMiembros : null;

  // Datos de pago: se copian del método de pago elegido en el perfil.
  const metodoPagoId = String(formData.get("metodoPagoId") ?? "").trim();
  let datosPago = undefined;
  if (metodoPagoId) {
    const mp = await prisma.metodoPago.findFirst({
      where: { id: metodoPagoId, usuarioId: usuario.id },
    });
    if (mp) {
      datosPago = {
        create: {
          tipo: mp.categoria === "cripto" ? "wallet" : mp.metodo,
          banco: mp.banco,
          tipoCuenta: mp.tipoCuenta,
          numeroCuenta: mp.numeroCuenta,
          titular: mp.titular,
          cedula: mp.cedula,
          telefono: mp.telefono,
          wallet: mp.wallet,
        },
      };
    }
  }

  const recolecta = await prisma.recolecta.create({
    data: {
      tipo,
      nombre,
      descripcion: descripcion ?? null,
      visibilidad,
      moneda,
      organizadorId: usuario.id,
      montoAporte: aportePorPersona,
      meta: monto, // meta por turno (san) o meta a juntar (vaca)
      frecuencia: tipo === "san" ? (frecuencia ?? null) : null,
      frecuenciaDias: tipo === "san" ? (frecuenciaDias ?? null) : null,
      cupoMiembros: tipo === "san" ? cupoMiembros : null,
      participantes: { create: { usuarioId: usuario.id } },
      datosPago,
    },
  });
  redirect(`/sanes/${recolecta.id}`);
}

/** Extrae el id de un código pegado o de un enlace de invitación completo. */
function limpiarCodigo(codigo: string): string {
  return (
    codigo.trim().split("?")[0].split("#")[0].split("/").pop()?.trim() ?? ""
  );
}

export type ResultadoBusqueda = {
  ok?: boolean;
  error?: string;
  recolecta?: {
    id: string;
    nombre: string;
    tipo: string;
    estado: string;
    visibilidad: string;
    organizador: string;
    miembros: number;
    yaUnido: boolean;
    abierta: boolean;
  };
};

/** Busca un ahorro por su código/enlace para mostrarlo antes de unirse. */
export async function buscarRecolecta(
  codigo: string,
): Promise<ResultadoBusqueda> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const id = limpiarCodigo(codigo);
  if (!id) return { error: "Escribe un código o pega el enlace de invitación." };

  const r = await prisma.recolecta.findUnique({
    where: { id },
    include: {
      organizador: true,
      _count: { select: { participantes: true } },
    },
  });
  if (!r) return { error: "No encontramos ningún ahorro con ese código." };

  const yaUnido = await prisma.participante.findUnique({
    where: { recolectaId_usuarioId: { recolectaId: r.id, usuarioId: usuario.id } },
  });

  return {
    ok: true,
    recolecta: {
      id: r.id,
      nombre: r.nombre,
      tipo: r.tipo,
      estado: r.estado,
      visibilidad: r.visibilidad,
      organizador: r.organizador.nombre ?? r.organizador.correo,
      miembros: r._count.participantes,
      yaUnido: Boolean(yaUnido),
      abierta: r.estado === "abierta",
    },
  };
}

/** Une al usuario a un ahorro por código/enlace y lo lleva al detalle. */
export async function unirseARecolecta(
  codigo: string,
): Promise<{ error?: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const id = limpiarCodigo(codigo);
  const r = await prisma.recolecta.findUnique({ where: { id } });
  if (!r) return { error: "No encontramos ese ahorro." };
  if (r.organizadorId === usuario.id) redirect(`/sanes/${r.id}`);
  if (r.estado !== "abierta") {
    return { error: "Este ahorro ya no admite nuevos miembros." };
  }
  try {
    await prisma.participante.create({
      data: { recolectaId: r.id, usuarioId: usuario.id },
    });
    await crearNotificacion(r.organizadorId, {
      tipo: "union",
      titulo: "Alguien se unió a tu ahorro",
      cuerpo: `${usuario.nombre ?? usuario.correo} se unió a "${r.nombre}".`,
      enlace: `/sanes/${r.id}`,
    });
  } catch {
    // ya estaba unido
  }
  redirect(`/sanes/${r.id}`);
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
    await crearNotificacion(invitado.id, {
      tipo: "invitacion",
      titulo: "Te uniste a una recolecta",
      cuerpo: `Ahora participas en "${recolecta.nombre}".`,
      enlace: `/sanes/${recolectaId}`,
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
  await notificarVarios(
    recolecta.participantes
      .map((p) => p.usuarioId)
      .filter((id) => id !== usuario.id),
    {
      tipo: "turnos",
      titulo: "Se sortearon los turnos",
      cuerpo: `Ya hay orden de turnos en "${recolecta.nombre}".`,
      enlace: `/sanes/${recolectaId}`,
    },
  );
  revalidatePath(`/sanes/${recolectaId}`);
}

export async function reportarPago(
  recolectaId: string,
  formData: FormData,
): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const participante = await prisma.participante.findUnique({
    where: { recolectaId_usuarioId: { recolectaId, usuarioId: usuario.id } },
  });
  if (!participante) return;

  const monto = Number(formData.get("monto"));
  const referencia =
    String(formData.get("referencia") ?? "").trim() || null;
  if (!monto || monto <= 0) return;

  await prisma.aporte.create({
    data: { recolectaId, participanteId: participante.id, monto, referencia },
  });
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
  });
  if (recolecta) {
    await crearNotificacion(recolecta.organizadorId, {
      tipo: "pago_reportado",
      titulo: "Nuevo pago reportado",
      cuerpo: `${usuario.correo} reportó $${monto} en "${recolecta.nombre}".`,
      enlace: `/sanes/${recolectaId}`,
    });
  }
  revalidatePath(`/sanes/${recolectaId}`);
}

export async function resolverAporte(
  aporteId: string,
  confirmar: boolean,
): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const aporte = await prisma.aporte.findUnique({
    where: { id: aporteId },
    include: { recolecta: true, participante: true },
  });
  if (!aporte || aporte.recolecta.organizadorId !== usuario.id) return;

  await prisma.aporte.update({
    where: { id: aporteId },
    data: { estado: confirmar ? "confirmado" : "rechazado" },
  });
  await crearNotificacion(aporte.participante.usuarioId, {
    tipo: "pago_resuelto",
    titulo: confirmar ? "Tu pago fue confirmado" : "Tu pago fue rechazado",
    cuerpo: `En "${aporte.recolecta.nombre}".`,
    enlace: `/sanes/${aporte.recolectaId}`,
  });
  revalidatePath(`/sanes/${aporte.recolectaId}`);
}

export async function cerrarRecolecta(recolectaId: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
    include: { participantes: true },
  });
  if (
    !recolecta ||
    recolecta.organizadorId !== usuario.id ||
    recolecta.estado === "cerrada"
  ) {
    return;
  }
  await prisma.recolecta.update({
    where: { id: recolectaId },
    data: { estado: "cerrada" },
  });
  await notificarVarios(
    recolecta.participantes.map((p) => p.usuarioId),
    {
      tipo: "cierre",
      titulo: "Recolecta cerrada",
      cuerpo: `"${recolecta.nombre}" se cerró. Valora a los demás participantes.`,
      enlace: `/sanes/${recolectaId}`,
    },
  );
  revalidatePath(`/sanes/${recolectaId}`);
}

export async function valorar(
  recolectaId: string,
  aUsuarioId: string,
  voto: number,
): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario || usuario.id === aUsuarioId) return;
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
    include: { participantes: true },
  });
  if (!recolecta || recolecta.estado !== "cerrada") return;
  const ids = recolecta.participantes.map((p) => p.usuarioId);
  if (!ids.includes(usuario.id) || !ids.includes(aUsuarioId)) return;

  await prisma.valoracion.upsert({
    where: {
      recolectaId_deUsuarioId_aUsuarioId: {
        recolectaId,
        deUsuarioId: usuario.id,
        aUsuarioId,
      },
    },
    create: {
      recolectaId,
      deUsuarioId: usuario.id,
      aUsuarioId,
      voto: voto > 0 ? 1 : -1,
    },
    update: { voto: voto > 0 ? 1 : -1 },
  });
  revalidatePath(`/sanes/${recolectaId}`);
}
