"use server";

import { revalidatePath } from "next/cache";
import type { TipoDocumento, Nacionalidad } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { subirArchivo } from "@/lib/almacenamiento";
import { pasosRequeridos } from "@/lib/kyc/config";
import { ultimaVerificacion } from "@/lib/kyc/consultas";
import { ESTADOS_EN_CURSO } from "@/lib/kyc/estados";
import { notificarYCorreo } from "@/lib/notificaciones";

export type EstadoEnvioKyc = { ok?: boolean; error?: string };

const MAX_IMG = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO = 20 * 1024 * 1024; // 20 MB
const TIPOS_IMG = ["image/jpeg", "image/png", "application/pdf"];
const TIPOS_VIDEO = ["video/webm", "video/mp4"];

function extDe(tipo: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
    "video/webm": "webm",
    "video/mp4": "mp4",
  };
  return map[tipo] ?? "bin";
}

/** Sube un File del formData validando tipo/tamaño; devuelve su key. */
async function subirCampo(
  file: File,
  carpeta: string,
  nombre: string,
  esVideo: boolean,
): Promise<string> {
  const permitidos = esVideo ? TIPOS_VIDEO : TIPOS_IMG;
  const max = esVideo ? MAX_VIDEO : MAX_IMG;
  if (!permitidos.includes(file.type)) {
    throw new Error(
      esVideo
        ? "El video debe ser WEBM o MP4."
        : "Las imágenes deben ser JPG, PNG o PDF.",
    );
  }
  if (file.size > max) {
    throw new Error(
      esVideo
        ? "El video no puede superar 20 MB."
        : "Cada imagen no puede superar 5 MB.",
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${carpeta}/${nombre}.${extDe(file.type)}`;
  return subirArchivo(key, buffer, file.type);
}

export async function enviarVerificacion(
  _prev: EstadoEnvioKyc,
  formData: FormData,
): Promise<EstadoEnvioKyc> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };
  if (u.baneado) return { error: "Tu cuenta está suspendida." };

  // No permitir un nuevo envío si ya hay uno en curso.
  const ultima = await ultimaVerificacion(u.id);
  if (ultima && ESTADOS_EN_CURSO.includes(ultima.estado)) {
    return { error: "Ya tienes una verificación en revisión." };
  }
  if (ultima?.estado === "aprobada") {
    return { error: "Tu identidad ya está verificada." };
  }

  const pasos = await pasosRequeridos();

  // Campos de texto
  const tipoDocumento = (formData.get("tipoDocumento") || "") as TipoDocumento | "";
  const nacionalidad = (formData.get("nacionalidad") || "") as Nacionalidad | "";
  const numeroDocumento = String(formData.get("numeroDocumento") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();
  const estadoRegion = String(formData.get("estadoRegion") ?? "").trim();

  // Validación de documento
  if (pasos.DOCUMENTO) {
    if (tipoDocumento !== "cedula" && tipoDocumento !== "pasaporte") {
      return { error: "Elige el tipo de documento." };
    }
    if (!numeroDocumento) return { error: "Indica el número de documento." };
    if (tipoDocumento === "cedula" && nacionalidad !== "V" && nacionalidad !== "E") {
      return { error: "Elige la nacionalidad de la cédula (V o E)." };
    }
  }
  if (pasos.DIRECCION && (!direccion || !ciudad || !estadoRegion)) {
    return { error: "Completa tu dirección, ciudad y estado." };
  }

  // Crear la fila (pendiente) para tener el id del intento como carpeta.
  const verif = await prisma.verificacionKyc.create({
    data: {
      usuarioId: u.id,
      estado: "pendiente",
      tipoDocumento: pasos.DOCUMENTO ? (tipoDocumento as TipoDocumento) : null,
      nacionalidad:
        pasos.DOCUMENTO && tipoDocumento === "cedula"
          ? (nacionalidad as Nacionalidad)
          : null,
      numeroDocumento: pasos.DOCUMENTO ? numeroDocumento : null,
      direccion: pasos.DIRECCION ? direccion : null,
      ciudad: pasos.DIRECCION ? ciudad : null,
      estadoRegion: pasos.DIRECCION ? estadoRegion : null,
    },
  });

  const carpeta = `kyc/${u.id}/${verif.id}`;
  try {
    const updates: Record<string, string> = {};
    if (pasos.DOCUMENTO) {
      const frente = formData.get("docFrente");
      if (!(frente instanceof File) || frente.size === 0) {
        throw new Error("Falta la foto frontal del documento.");
      }
      updates.docFrenteKey = await subirCampo(frente, carpeta, "doc-frente", false);
      const reverso = formData.get("docReverso");
      if (tipoDocumento === "cedula") {
        if (!(reverso instanceof File) || reverso.size === 0) {
          throw new Error("Falta la foto del reverso de la cédula.");
        }
        updates.docReversoKey = await subirCampo(reverso, carpeta, "doc-reverso", false);
      } else if (reverso instanceof File && reverso.size > 0) {
        updates.docReversoKey = await subirCampo(reverso, carpeta, "doc-reverso", false);
      }
    }
    if (pasos.SELFIE) {
      const selfie = formData.get("selfie");
      if (!(selfie instanceof File) || selfie.size === 0) {
        throw new Error("Falta la selfie.");
      }
      updates.selfieKey = await subirCampo(selfie, carpeta, "selfie", false);
    }
    if (pasos.VIDEO) {
      const video = formData.get("video");
      if (!(video instanceof File) || video.size === 0) {
        throw new Error("Falta el video de verificación.");
      }
      updates.videoKey = await subirCampo(video, carpeta, "video", true);
    }
    await prisma.verificacionKyc.update({ where: { id: verif.id }, data: updates });
  } catch (e) {
    // Si falla una subida, eliminamos la fila incompleta para no dejar basura.
    await prisma.verificacionKyc.delete({ where: { id: verif.id } }).catch(() => {});
    return { error: e instanceof Error ? e.message : "No se pudo subir los archivos." };
  }

  await notificarYCorreo(u, {
    tipo: "kyc",
    titulo: "Recibimos tu verificación 📋",
    cuerpo:
      "Estamos revisando tu identidad. Te avisaremos por aquí y por correo cuando haya respuesta.",
    enlace: "/configuracion?tab=verificacion",
  });

  revalidatePath("/configuracion");
  return { ok: true };
}
