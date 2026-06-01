"use server";

import { revalidatePath } from "next/cache";
import type { Rol } from "@prisma/client";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import {
  guardarConfig,
  obtenerConfigSmtp,
  borrarConfig,
  CLAVES_APP,
} from "@/lib/config";
import { CLAVES_BLACKLIST } from "@/lib/restricciones";
import { enviarCorreo, verificarConexionSmtp } from "@/lib/mailer";
import { resolverNotificacion } from "@/lib/correo/resolver";
import {
  eventoPorClave,
  clavesPlantilla,
  type CanalPlantilla,
} from "@/lib/correo/catalogo";

const ROLES: Rol[] = ["usuario", "admin_grupo", "super_admin"];

async function esAdmin(): Promise<boolean> {
  const u = await obtenerUsuario();
  return u?.rol === "super_admin";
}

export async function cambiarRol(
  usuarioId: string,
  formData: FormData,
): Promise<void> {
  if (!(await esAdmin())) return;
  const rol = String(formData.get("rol") ?? "") as Rol;
  if (!ROLES.includes(rol)) return;
  await prisma.usuario.update({ where: { id: usuarioId }, data: { rol } });
  revalidatePath("/admin");
}

export type EstadoConfigSmtp = { ok?: boolean; error?: string };

export async function guardarSmtp(
  _prev: EstadoConfigSmtp,
  formData: FormData,
): Promise<EstadoConfigSmtp> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  for (const clave of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER"]) {
    await guardarConfig(clave, String(formData.get(clave) ?? "").trim());
  }
  // El remitente se compone de nombre + correo ("Nombre <correo>").
  const fromNombre = String(formData.get("SMTP_FROM_NAME") ?? "").trim();
  const fromCorreo = String(formData.get("SMTP_FROM_EMAIL") ?? "").trim();
  await guardarConfig(
    "SMTP_FROM",
    fromNombre && fromCorreo ? `${fromNombre} <${fromCorreo}>` : fromCorreo,
  );
  await guardarConfig(
    "SMTP_SECURE",
    formData.get("SMTP_SECURE") === "on" ? "true" : "false",
  );
  // La contraseña solo se actualiza si se escribe una nueva (no se vacía).
  const pass = String(formData.get("SMTP_PASS") ?? "").trim();
  if (pass) await guardarConfig("SMTP_PASS", pass);
  revalidatePath("/admin");
  return { ok: true };
}

export async function verificarConexion(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!(await esAdmin())) return { ok: false, error: "No autorizado." };
  return verificarConexionSmtp();
}

export type EstadoPlantilla = { ok?: boolean; error?: string };

export async function guardarPlantilla(
  _prev: EstadoPlantilla,
  formData: FormData,
): Promise<EstadoPlantilla> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  const clave = String(formData.get("clave") ?? "").trim();
  const canal = String(formData.get("canal") ?? "") as CanalPlantilla;
  if (!eventoPorClave(clave) || (canal !== "app" && canal !== "correo")) {
    return { error: "Plantilla desconocida." };
  }
  const k = clavesPlantilla(clave, canal);
  await guardarConfig(k.asunto, String(formData.get("asunto") ?? "").trim());
  await guardarConfig(k.contenido, String(formData.get("contenido") ?? ""));
  revalidatePath("/admin");
  return { ok: true };
}

export async function enviarPruebaPlantilla(
  clave: string,
  destino: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await esAdmin())) return { ok: false, error: "No autorizado." };
  const evento = eventoPorClave(clave);
  if (!evento) return { ok: false, error: "Plantilla desconocida." };
  if (!destino.includes("@")) return { ok: false, error: "Correo inválido." };
  try {
    const p = await resolverNotificacion(clave, "correo", evento.datosMuestra);
    if (p) await enviarCorreo(destino, p.asunto, p.texto, p.contenido);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function restablecerPlantilla(
  clave: string,
  canal: CanalPlantilla,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await esAdmin())) return { ok: false, error: "No autorizado." };
  const k = clavesPlantilla(clave, canal);
  await borrarConfig([k.asunto, k.contenido]);
  revalidatePath("/admin");
  return { ok: true };
}

export type EstadoPruebaSmtp = { ok?: boolean; error?: string; mensaje?: string };

export async function enviarCorreoPrueba(
  _prev: EstadoPruebaSmtp,
  formData: FormData,
): Promise<EstadoPruebaSmtp> {
  if (!(await esAdmin())) return { error: "No autorizado." };
  const destino = String(formData.get("destino") ?? "").trim();
  if (!destino || !destino.includes("@")) {
    return { error: "Indica un correo válido." };
  }
  const cfg = await obtenerConfigSmtp();
  const host = cfg.SMTP_HOST || process.env.SMTP_HOST;
  if (!host) {
    return {
      error:
        "No hay SMTP configurado (host vacío). Guarda primero la configuración SMTP; sin eso el correo solo iría a la consola del servidor.",
    };
  }
  try {
    const p = await resolverNotificacion("prueba_smtp", "correo", {});
    if (p) await enviarCorreo(destino, p.asunto, p.texto, p.contenido);
    return { ok: true, mensaje: `Correo de prueba enviado a ${destino}.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Falló el envío: ${msg}` };
  }
}

export async function guardarAppConfig(formData: FormData): Promise<void> {
  if (!(await esAdmin())) return;
  for (const clave of CLAVES_APP) {
    // Se guarda siempre (permite vaciar un campo).
    const valor = String(formData.get(clave) ?? "").trim();
    await guardarConfig(clave, valor);
  }
  revalidatePath("/admin");
}

export async function guardarRestricciones(formData: FormData): Promise<void> {
  if (!(await esAdmin())) return;
  await guardarConfig(
    CLAVES_BLACKLIST.nombre,
    String(formData.get("nombre") ?? "").trim(),
  );
  await guardarConfig(
    CLAVES_BLACKLIST.apellido,
    String(formData.get("apellido") ?? "").trim(),
  );
  await guardarConfig(
    CLAVES_BLACKLIST.nombreUsuario,
    String(formData.get("nombreUsuario") ?? "").trim(),
  );
  revalidatePath("/admin");
}
