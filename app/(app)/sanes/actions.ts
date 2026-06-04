"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { credencialValida } from "@/lib/auth/credencial";
import { crearRecolectaSchema } from "@/lib/validations/recolecta";
import {
  crearNotificacion,
  notificarEvento,
  notificarVarios,
  notificarYCorreo,
} from "@/lib/notificaciones";
import { etiquetaUsuario } from "@/lib/usuario-etiqueta";
import { nuevoCodigo } from "@/lib/san/codigo-invitacion";
import { perfilVerificado } from "@/lib/perfil-verificado";

export type EstadoRecolecta = { error?: string };

export async function crearRecolecta(
  _estado: EstadoRecolecta,
  formData: FormData,
): Promise<EstadoRecolecta> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  const pin = String(formData.get("pin") ?? "");
  if (!pin || !(await credencialValida(usuario.id, pin))) {
    return { error: "PIN incorrecto. Confirma tu PIN para crear el ahorro." };
  }

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
  await notificarYCorreo(
    { id: usuario.id, correo: usuario.correo },
    {
      tipo: "ahorro",
      titulo: "¡Creaste tu ahorro!",
      cuerpo: `Tu ${tipo === "san" ? "san" : "vaca"} "${nombre}" se creó correctamente. Invita a tu gente para empezar.`,
      enlace: `/sanes/${recolecta.id}`,
    },
  );
  redirect(`/sanes/${recolecta.id}`);
}

/** Extrae el último segmento de un código pegado o de un enlace completo. */
function limpiarCodigo(codigo: string): string {
  return (
    codigo.trim().split("?")[0].split("#")[0].split("/").pop()?.trim() ?? ""
  );
}

/**
 * Resuelve lo que el usuario pega (id del san, enlace `/sanes/<id>`, enlace
 * `/i/<codigo>`, o el código de invitación `GS-XXXXXX`) al id de la recolecta.
 * Primero prueba como id de san; si no, como código de invitación válido.
 */
async function resolverRecolectaId(codigo: string): Promise<string | null> {
  const limpio = limpiarCodigo(codigo);
  if (!limpio) return null;
  const san = await prisma.recolecta.findUnique({
    where: { id: limpio },
    select: { id: true },
  });
  if (san) return san.id;
  const cod = limpio.replace(/^GS-/i, "").toUpperCase();
  const inv = await invitacionValida(cod);
  return inv ? inv.recolecta.id : null;
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
  const id = await resolverRecolectaId(codigo);
  if (!id) return { error: "No encontramos ningún ahorro con ese código." };

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

type ResultadoUnion = { error?: string; ok?: string; verificar?: boolean };

type UsuarioUnion = {
  id: string;
  correo: string;
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  nivelKyc: number;
};

type RecolectaUnion = {
  id: string;
  nombre: string;
  estado: string;
  visibilidad: string;
  organizadorId: string;
  organizador: { id: string; correo: string; nombre: string | null };
};

/**
 * Lógica común al unirse a un ahorro: el organizador y los ya miembros van al
 * detalle; un san **público** une directo (y avisa al organizador); un san
 * **privado** genera una **solicitud** que el organizador debe aprobar.
 */
async function procesarUnion(
  r: RecolectaUnion,
  usuario: UsuarioUnion,
  pin: string,
): Promise<ResultadoUnion> {
  if (r.organizadorId === usuario.id) redirect(`/sanes/${r.id}`);

  const yaMiembro = await prisma.participante.findUnique({
    where: { recolectaId_usuarioId: { recolectaId: r.id, usuarioId: usuario.id } },
  });
  if (yaMiembro) redirect(`/sanes/${r.id}`);

  if (r.estado !== "abierta") {
    return { error: "Este ahorro ya no admite nuevos miembros." };
  }

  // Portero: el perfil debe estar verificado (KYC nivel ≥ 1) para participar.
  if (!perfilVerificado(usuario)) {
    return {
      error: "Verifica tu perfil para unirte a un ahorro.",
      verificar: true,
    };
  }

  // Confirmar la acción con el PIN.
  if (!pin || !(await credencialValida(usuario.id, pin))) {
    return { error: "PIN incorrecto. Confírmalo para unirte." };
  }

  if (r.visibilidad === "privado") {
    const pendiente = await prisma.solicitudUnion.findUnique({
      where: { recolectaId_usuarioId: { recolectaId: r.id, usuarioId: usuario.id } },
    });
    if (pendiente?.estado === "pendiente") {
      return { ok: "Ya tienes una solicitud pendiente. El organizador la revisará." };
    }
    await prisma.solicitudUnion.upsert({
      where: { recolectaId_usuarioId: { recolectaId: r.id, usuarioId: usuario.id } },
      create: { recolectaId: r.id, usuarioId: usuario.id, estado: "pendiente" },
      update: { estado: "pendiente", resueltaEn: null },
    });
    await notificarEvento(
      { id: r.organizador.id, correo: r.organizador.correo },
      "san_solicitud_union",
      {
        solicitante: etiquetaUsuario(usuario),
        nombreSan: r.nombre,
        link: `/sanes/${r.id}`,
      },
      { tipo: "solicitud_union", enlace: `/sanes/${r.id}` },
    );
    revalidatePath(`/sanes/${r.id}`);
    return { ok: "Solicitud enviada. El organizador la revisará." };
  }

  // San público: unión directa.
  try {
    await prisma.participante.create({
      data: { recolectaId: r.id, usuarioId: usuario.id },
    });
  } catch {
    // ya estaba unido
  }
  await notificarEvento(
    { id: r.organizador.id, correo: r.organizador.correo },
    "union_san",
    {
      organizador: r.organizador.nombre ?? r.organizador.correo,
      usuario: etiquetaUsuario(usuario),
      nombreSan: r.nombre,
      link: `/sanes/${r.id}`,
    },
    { tipo: "union", enlace: `/sanes/${r.id}` },
  );
  redirect(`/sanes/${r.id}`);
}

const SELECT_UNION = {
  id: true,
  nombre: true,
  estado: true,
  visibilidad: true,
  organizadorId: true,
  organizador: { select: { id: true, correo: true, nombre: true } },
} as const;

/** Une al usuario a un ahorro por código/enlace (id del san). Privado → solicitud. */
export async function unirseARecolecta(
  codigo: string,
  pin = "",
): Promise<ResultadoUnion> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const id = await resolverRecolectaId(codigo);
  if (!id) return { error: "No encontramos ese ahorro." };
  const r = await prisma.recolecta.findUnique({
    where: { id },
    select: SELECT_UNION,
  });
  if (!r) return { error: "No encontramos ese ahorro." };
  return procesarUnion(r, usuario, pin);
}

/** Genera una invitación temporal con código corto. Vigencia 1/7/30 días (default 7). */
export async function generarInvitacion(
  recolectaId: string,
  diasVigencia: number,
): Promise<{ codigo?: string; enlace?: string; error?: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const r = await prisma.recolecta.findUnique({ where: { id: recolectaId } });
  if (!r || r.organizadorId !== usuario.id) return { error: "No autorizado." };
  if (r.estado === "cerrada") {
    return { error: "Este ahorro está cerrado." };
  }

  const dias = [1, 7, 30].includes(diasVigencia) ? diasVigencia : 7;
  const expiraEn = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  // Reintenta ante colisión del índice @unique de `codigo`.
  for (let intento = 0; intento < 5; intento++) {
    const codigo = nuevoCodigo();
    try {
      await prisma.invitacion.create({
        data: { recolectaId, codigo, creadaPor: usuario.id, expiraEn },
      });
      revalidatePath(`/sanes/${recolectaId}`);
      return { codigo, enlace: `/i/${codigo}` };
    } catch {
      // colisión de código: reintenta
    }
  }
  return { error: "No se pudo generar la invitación, inténtalo de nuevo." };
}

/** Revoca una invitación (solo el organizador del san dueño). */
export async function revocarInvitacion(invitacionId: string): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const inv = await prisma.invitacion.findUnique({
    where: { id: invitacionId },
    include: { recolecta: { select: { id: true, organizadorId: true } } },
  });
  if (!inv || inv.recolecta.organizadorId !== usuario.id) return;
  await prisma.invitacion.update({
    where: { id: invitacionId },
    data: { revocada: true },
  });
  revalidatePath(`/sanes/${inv.recolecta.id}`);
}

/** Invitaciones vigentes (no revocadas, no vencidas) de un san. */
export async function listarInvitacionesActivas(recolectaId: string) {
  return prisma.invitacion.findMany({
    where: { recolectaId, revocada: false, expiraEn: { gt: new Date() } },
    orderBy: { creadaEn: "desc" },
  });
}

/** Resuelve un código de invitación a la recolecta si la invitación es válida. */
async function invitacionValida(codigo: string) {
  const inv = await prisma.invitacion.findUnique({
    where: { codigo: codigo.trim() },
    include: { recolecta: { select: SELECT_UNION } },
  });
  if (!inv || inv.revocada || inv.expiraEn <= new Date()) return null;
  return inv;
}

/** Datos del san detrás de un código de invitación, para la landing /i/[codigo]. */
export async function infoInvitacion(codigo: string): Promise<{
  ok?: boolean;
  error?: string;
  san?: { nombre: string; estado: string };
}> {
  const inv = await invitacionValida(codigo);
  if (!inv) return { error: "Este enlace de invitación ya no es válido." };
  return { ok: true, san: { nombre: inv.recolecta.nombre, estado: inv.recolecta.estado } };
}

/** El usuario con sesión solicita unirse usando un código de invitación. */
export async function solicitarUnion(
  codigo: string,
  pin = "",
): Promise<ResultadoUnion> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const inv = await invitacionValida(codigo);
  if (!inv) return { error: "Este enlace de invitación ya no es válido." };
  return procesarUnion(inv.recolecta, usuario, pin);
}

/** El organizador aprueba o rechaza una solicitud de unión. */
export async function resolverSolicitud(
  solicitudId: string,
  aprobar: boolean,
): Promise<void> {
  const usuario = await obtenerUsuario();
  if (!usuario) return;
  const sol = await prisma.solicitudUnion.findUnique({
    where: { id: solicitudId },
    include: {
      recolecta: { select: { id: true, nombre: true, organizadorId: true } },
      usuario: { select: { id: true, correo: true } },
    },
  });
  if (!sol || sol.recolecta.organizadorId !== usuario.id) return;
  if (sol.estado !== "pendiente") return;

  await prisma.solicitudUnion.update({
    where: { id: solicitudId },
    data: { estado: aprobar ? "aprobada" : "rechazada", resueltaEn: new Date() },
  });

  if (aprobar) {
    try {
      await prisma.participante.create({
        data: { recolectaId: sol.recolecta.id, usuarioId: sol.usuarioId },
      });
    } catch {
      // ya era miembro
    }
  }

  await notificarEvento(
    { id: sol.usuario.id, correo: sol.usuario.correo },
    aprobar ? "san_solicitud_aceptada" : "san_solicitud_rechazada",
    { nombreSan: sol.recolecta.nombre, link: `/sanes/${sol.recolecta.id}` },
    { tipo: "solicitud_resuelta", enlace: `/sanes/${sol.recolecta.id}` },
  );
  revalidatePath(`/sanes/${sol.recolecta.id}`);
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
    include: { organizador: { select: { id: true, correo: true, nombre: true } } },
  });
  if (recolecta) {
    await notificarEvento(
      { id: recolecta.organizador.id, correo: recolecta.organizador.correo },
      "san_pago_reportado",
      {
        organizador: recolecta.organizador.nombre ?? recolecta.organizador.correo,
        usuario: etiquetaUsuario(usuario),
        monto: `$${monto}`,
        nombreSan: recolecta.nombre,
        link: `/sanes/${recolectaId}`,
      },
      { tipo: "pago_reportado", enlace: `/sanes/${recolectaId}` },
    );
  }
  revalidatePath(`/sanes/${recolectaId}`);
}

export async function resolverAporte(
  aporteId: string,
  confirmar: boolean,
  pin = "",
): Promise<{ error?: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const aporte = await prisma.aporte.findUnique({
    where: { id: aporteId },
    include: {
      recolecta: true,
      participante: { include: { usuario: { select: { id: true, correo: true, nombre: true, apellido: true, nombreUsuario: true } } } },
    },
  });
  if (!aporte || aporte.recolecta.organizadorId !== usuario.id) {
    return { error: "No autorizado." };
  }
  // Confirmar la acción con el PIN (declaración de recepción de fondos al aprobar).
  if (!pin || !(await credencialValida(usuario.id, pin))) {
    return { error: "PIN incorrecto. Confírmalo para continuar." };
  }

  await prisma.aporte.update({
    where: { id: aporteId },
    data: { estado: confirmar ? "confirmado" : "rechazado" },
  });

  const participanteUsuario = aporte.participante.usuario;

  await notificarEvento(
    { id: participanteUsuario.id, correo: participanteUsuario.correo },
    confirmar ? "san_pago_aprobado" : "san_pago_rechazado",
    {
      usuario: etiquetaUsuario(participanteUsuario),
      monto: `$${aporte.monto}`,
      nombreSan: aporte.recolecta.nombre,
      link: `/sanes/${aporte.recolectaId}`,
    },
    { tipo: "pago_resuelto", enlace: `/sanes/${aporte.recolectaId}` },
  );
  revalidatePath(`/sanes/${aporte.recolectaId}`);
  return {};
}

export async function cerrarRecolecta(
  recolectaId: string,
  pin = "",
): Promise<{ error?: string }> {
  const usuario = await obtenerUsuario();
  if (!usuario) return { error: "Inicia sesión." };
  const recolecta = await prisma.recolecta.findUnique({
    where: { id: recolectaId },
    include: { participantes: true },
  });
  if (
    !recolecta ||
    recolecta.organizadorId !== usuario.id ||
    recolecta.estado === "cerrada"
  ) {
    return { error: "No se puede cerrar este ahorro." };
  }
  // Confirmar con el PIN (acción irreversible).
  if (!pin || !(await credencialValida(usuario.id, pin))) {
    return { error: "PIN incorrecto. Confírmalo para cerrar el ahorro." };
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
  return {};
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
