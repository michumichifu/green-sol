"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { hashContrasena, verificarContrasena } from "@/lib/auth/password";
import { contrasenaSchema } from "@/lib/validations/auth";
import { notificarYCorreo } from "@/lib/notificaciones";
import { pinFormatoValido, hashearPin, verificarPin } from "@/lib/auth/pin";

export type EstadoSeguridad = { ok?: boolean; error?: string };

export async function definirPin(
  _prev: EstadoSeguridad,
  formData: FormData,
): Promise<EstadoSeguridad> {
  const u = await obtenerUsuario();
  if (!u) return { error: "No autorizado." };

  const pinActual = String(formData.get("pinActual") ?? "").trim();
  const pinNuevo = String(formData.get("pin") ?? "").trim();
  const pinNuevo2 = String(formData.get("pin2") ?? "").trim();

  // Validar el nuevo PIN con la misma función que usa login/registro.
  if (!/^\d{6}$/.test(pinNuevo)) {
    return { error: "El PIN debe ser de exactamente 6 dígitos." };
  }
  if (!pinFormatoValido(pinNuevo)) {
    return { error: "Elige un PIN menos obvio." };
  }
  if (pinNuevo !== pinNuevo2) return { error: "Los PIN no coinciden." };

  // Confirmar identidad: si ya tiene PIN → confirmar con PIN actual (credencial).
  // Caso borde: si aún no tiene PIN pero sí tiene contraseña → confirmar con contraseña.
  if (u.pinHash) {
    const r = await verificarPin(u.id, pinActual);
    if (!r.ok) return { error: r.error };
  } else if (u.hashContrasena) {
    const claveActual = String(formData.get("clave") ?? "");
    if (!(await verificarContrasena(u.hashContrasena, claveActual))) {
      return { error: "Contraseña incorrecta." };
    }
  } else if (u.registradoCon === "wallet") {
    // Usuario registrado con wallet: su identidad ya quedó probada por la firma al
    // iniciar sesión, así que puede fijar su primer PIN sin credencial previa.
  } else {
    // Sin PIN ni contraseña: estado inalcanzable por los flujos de la app. Lo
    // rechazamos explícitamente para que ninguna sesión robada pueda fijar un PIN
    // sin confirmar identidad (defensa ante seeds/admin futuros).
    return { error: "No se pudo verificar tu identidad." };
  }

  await prisma.usuario.update({
    where: { id: u.id },
    data: { pinHash: await hashearPin(pinNuevo) },
  });
  await notificarYCorreo(u, {
    tipo: "seguridad",
    titulo: "Cambiaste tu PIN de acceso 🔐",
    cuerpo:
      "El PIN de acceso a tu cuenta fue actualizado. Si no fuiste tú, contacta a soporte de inmediato.",
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

  // Seguridad anti-lockout: si el PIN es la única credencial, no se puede quitar.
  if (!u.hashContrasena) {
    return {
      error:
        "No puedes quitar tu PIN: es tu forma de iniciar sesión. Para quitarlo necesitas tener una contraseña configurada.",
    };
  }

  // El usuario tiene contraseña → confirmar con ella antes de eliminar el PIN.
  const clave = String(formData.get("clave") ?? "");
  if (!(await verificarContrasena(u.hashContrasena, clave))) {
    return { error: "Contraseña incorrecta." };
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

  // La contraseña es el factor fuerte; cambiarla solo requiere la contraseña actual.
  // (La regla vieja de exigir un 2FA activo ya no aplica: el PIN es la credencial de acceso.)
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
    data: { hashContrasena: await hashContrasena(nueva) },
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
