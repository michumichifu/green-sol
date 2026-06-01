"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { verificarContrasena } from "@/lib/auth/password";
import { contrasenaSchema } from "@/lib/validations/auth";
import { notificarYCorreo } from "@/lib/notificaciones";

export type EstadoSeguridad = { ok?: boolean; error?: string };

/** Confirma la contraseña del usuario logueado (para acciones de seguridad). */
async function confirmarClave(
  usuarioId: string,
  clave: string,
): Promise<boolean> {
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!u?.hashContrasena) return false;
  return verificarContrasena(u.hashContrasena, clave);
}

export async function definirPin(
  _prev: EstadoSeguridad,
  formData: FormData,
): Promise<EstadoSeguridad> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };
  const pin = String(formData.get("pin") ?? "").trim();
  const pin2 = String(formData.get("pin2") ?? "").trim();
  const clave = String(formData.get("clave") ?? "");
  if (!/^\d{4,6}$/.test(pin)) {
    return { error: "El PIN debe tener de 4 a 6 dígitos." };
  }
  if (pin !== pin2) return { error: "Los PIN no coinciden." };
  if (!(await confirmarClave(u.id, clave))) {
    return { error: "Clave de la cuenta incorrecta." };
  }
  await prisma.usuario.update({
    where: { id: u.id },
    data: { pinHash: await hash(pin) },
  });
  await notificarYCorreo(u, {
    tipo: "seguridad",
    titulo: "Agregaste un PIN de seguridad 🔐",
    cuerpo:
      "Se añadió un PIN como verificación a tu cuenta. Si no fuiste tú, cambia tu contraseña y contacta a soporte.",
    enlace: "/configuracion?tab=seguridad",
  });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function quitarPin(
  _prev: EstadoSeguridad,
  formData: FormData,
): Promise<EstadoSeguridad> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };
  const clave = String(formData.get("clave") ?? "");
  if (!(await confirmarClave(u.id, clave))) {
    return { error: "Clave de la cuenta incorrecta." };
  }
  await prisma.usuario.update({
    where: { id: u.id },
    data: { pinHash: null },
  });
  await notificarYCorreo(u, {
    tipo: "seguridad",
    titulo: "Quitaste tu PIN de seguridad",
    cuerpo:
      "Se eliminó el PIN de tu cuenta. Si no fuiste tú, cambia tu contraseña y contacta a soporte.",
    enlace: "/configuracion?tab=seguridad",
  });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function alternarOtpCorreo(
  activar: boolean,
): Promise<EstadoSeguridad> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };
  await prisma.usuario.update({
    where: { id: u.id },
    data: { otpCorreoActivo: activar },
  });
  await notificarYCorreo(u, {
    tipo: "seguridad",
    titulo: activar
      ? "Activaste el código por correo 🔐"
      : "Desactivaste el código por correo",
    cuerpo: activar
      ? "Ahora te pediremos un código por correo al confirmar acciones importantes. Si no fuiste tú, cambia tu contraseña."
      : "Ya no usarás el código por correo como verificación. Si no fuiste tú, cambia tu contraseña y contacta a soporte.",
    enlace: "/configuracion?tab=seguridad",
  });
  revalidatePath("/configuracion");
  return { ok: true };
}

export async function cambiarContrasena(
  _prev: EstadoSeguridad,
  formData: FormData,
): Promise<EstadoSeguridad> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };
  const usuario = await prisma.usuario.findUnique({ where: { id: u.id } });
  if (!usuario?.hashContrasena) return { error: "Tu cuenta no tiene clave." };

  // Regla: no se puede cambiar la contraseña sin al menos un 2FA activo.
  if (!usuario.pinHash && !usuario.otpCorreoActivo) {
    return {
      error:
        "Primero agrega un método de verificación (PIN o código por correo) para poder cambiar tu contraseña.",
    };
  }

  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (!(await verificarContrasena(usuario.hashContrasena, actual))) {
    return { error: "La contraseña actual es incorrecta." };
  }
  const v = contrasenaSchema.safeParse(nueva);
  if (!v.success) return { error: v.error.issues[0].message };
  if (nueva !== confirmar) return { error: "Las contraseñas no coinciden." };

  await prisma.usuario.update({
    where: { id: u.id },
    data: { hashContrasena: await hash(nueva) },
  });
  await notificarYCorreo(u, {
    tipo: "seguridad",
    titulo: "Cambiaste tu contraseña 🔐",
    cuerpo:
      "La contraseña de tu cuenta se actualizó. Si no fuiste tú, contacta a soporte de inmediato.",
    enlace: "/configuracion?tab=seguridad",
  });
  revalidatePath("/configuracion");
  return { ok: true };
}
