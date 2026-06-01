"use server";

import { revalidatePath } from "next/cache";
import type { EstadoKyc } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { urlFirmadaLectura } from "@/lib/almacenamiento";
import { puedeTransicionar } from "@/lib/kyc/estados";
import { guardarConfig } from "@/lib/config";
import { PASOS_KYC, type PasoKyc } from "@/lib/kyc/config";
import { notificarYCorreo } from "@/lib/notificaciones";

export type EstadoRevision = { ok?: boolean; error?: string };

async function esAdmin(): Promise<boolean> {
  const u = await obtenerUsuario();
  return u?.rol === "super_admin";
}

/** Un super-admin toma una solicitud pendiente para revisarla. */
export async function tomarRevision(id: string): Promise<EstadoRevision> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  const v = await prisma.verificacionKyc.findUnique({ where: { id } });
  if (!v) return { error: "Solicitud no encontrada." };
  if (!puedeTransicionar(v.estado, "en_revision")) {
    return { error: "Esta solicitud no se puede tomar." };
  }
  const u = await obtenerUsuario();
  await prisma.verificacionKyc.update({
    where: { id },
    data: { estado: "en_revision", revisadoPorId: u!.id },
  });
  revalidatePath("/admin");
  return { ok: true };
}

export type AccionRevision = "aprobar" | "rechazar" | "reenvio" | "banear";

const DESTINO: Record<AccionRevision, EstadoKyc> = {
  aprobar: "aprobada",
  rechazar: "rechazada",
  reenvio: "reenvio_solicitado",
  banear: "baneada",
};

/** Resuelve una solicitud (debe estar en_revision). */
export async function resolverKyc(
  id: string,
  accion: AccionRevision,
  motivo?: string,
  nota?: string,
): Promise<EstadoRevision> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  const v = await prisma.verificacionKyc.findUnique({
    where: { id },
    include: { usuario: { select: { id: true, correo: true } } },
  });
  if (!v) return { error: "Solicitud no encontrada." };

  const destino = DESTINO[accion];
  if (!puedeTransicionar(v.estado, destino)) {
    return { error: "Primero toma la solicitud para revisarla." };
  }
  if ((accion === "rechazar" || accion === "reenvio") && !motivo?.trim()) {
    return { error: "Indica el motivo para el usuario." };
  }

  const revisor = await obtenerUsuario();
  await prisma.$transaction(async (tx) => {
    await tx.verificacionKyc.update({
      where: { id },
      data: {
        estado: destino,
        motivoRechazo: motivo?.trim() || null,
        notaInterna: nota?.trim() || null,
        revisadoPorId: revisor!.id,
        revisadaEn: new Date(),
      },
    });
    if (accion === "aprobar") {
      await tx.usuario.update({ where: { id: v.usuarioId }, data: { nivelKyc: 1 } });
    } else if (accion === "banear") {
      await tx.usuario.update({ where: { id: v.usuarioId }, data: { baneado: true } });
    }
  });

  // Notificar al usuario (app + correo)
  const avisos: Record<AccionRevision, { titulo: string; cuerpo: string }> = {
    aprobar: {
      titulo: "¡Verificación aprobada! 🎉",
      cuerpo: "Tu identidad fue verificada. Ya apareces como Verificado en tu perfil.",
    },
    rechazar: {
      titulo: "No pudimos verificar tu identidad",
      cuerpo: `Motivo: ${motivo?.trim()}. Si crees que es un error, contacta a soporte.`,
    },
    reenvio: {
      titulo: "Tu verificación necesita correcciones",
      cuerpo: `${motivo?.trim()}. Vuelve a Configuración → Verificación para reenviar.`,
    },
    banear: {
      titulo: "Tu cuenta fue suspendida",
      cuerpo: "Detectamos una irregularidad en tu verificación. Contacta a soporte.",
    },
  };
  await notificarYCorreo(v.usuario, {
    tipo: "kyc",
    titulo: avisos[accion].titulo,
    cuerpo: avisos[accion].cuerpo,
    enlace: "/configuracion?tab=verificacion",
  });

  revalidatePath("/admin");
  return { ok: true };
}

/** URLs firmadas (temporales) de los archivos de una solicitud — solo super-admin. */
export async function urlsRevision(
  id: string,
): Promise<{ docFrente?: string; docReverso?: string; selfie?: string; video?: string }> {
  if (!(await esAdmin())) return {};
  const v = await prisma.verificacionKyc.findUnique({ where: { id } });
  if (!v) return {};
  const out: Record<string, string> = {};
  if (v.docFrenteKey) out.docFrente = await urlFirmadaLectura(v.docFrenteKey, 300);
  if (v.docReversoKey) out.docReverso = await urlFirmadaLectura(v.docReversoKey, 300);
  if (v.selfieKey) out.selfie = await urlFirmadaLectura(v.selfieKey, 300);
  if (v.videoKey) out.video = await urlFirmadaLectura(v.videoKey, 300);
  return out;
}

/** Guarda los toggles de pasos requeridos del KYC. */
export async function guardarPasosKyc(
  valores: Partial<Record<PasoKyc, boolean>>,
): Promise<EstadoRevision> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  for (const paso of PASOS_KYC) {
    if (paso in valores) {
      await guardarConfig(`KYC_REQUIERE_${paso}`, valores[paso] ? "true" : "false");
    }
  }
  revalidatePath("/admin");
  return { ok: true };
}
