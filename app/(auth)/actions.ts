"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashContrasena, verificarContrasena } from "@/lib/auth/password";
import { crearYEnviarOtp, validarOtp } from "@/lib/auth/otp";
import { crearNotificacion } from "@/lib/notificaciones";
import { crearSesion, cerrarSesion, obtenerUsuario } from "@/lib/auth/session";
import { debeMostrarOnboarding } from "@/lib/onboarding";
import { validarRestricciones } from "@/lib/restricciones";
import {
  registroCompletoSchema,
  loginSchema,
  otpSchema,
} from "@/lib/validations/auth";
import { paisPorCodigo } from "@/lib/paises";

const PENDIENTE = "greensol_pendiente";

export type EstadoAuth = { error?: string };

async function guardarPendiente(correo: string) {
  (await cookies()).set(PENDIENTE, correo, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1800,
  });
}

export async function registrarse(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = registroCompletoSchema.safeParse({
    correo: formData.get("correo"),
    contrasena: formData.get("contrasena"),
    confirmar: formData.get("confirmar"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    nombreUsuario: formData.get("nombreUsuario"),
    pais: formData.get("pais"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { correo, contrasena, nombre, apellido, nombreUsuario, pais } =
    datos.data;
  const correoLower = correo.toLowerCase();

  const errorRest = await validarRestricciones({
    nombre,
    apellido,
    nombreUsuario,
  });
  if (errorRest) return { error: errorRest };

  const existente = await prisma.usuario.findUnique({
    where: { correo: correoLower },
  });
  if (existente?.correoVerificado) {
    return { error: "Ese correo ya está registrado." };
  }
  const userExistente = await prisma.usuario.findUnique({
    where: { nombreUsuario },
  });
  if (userExistente && userExistente.correo !== correoLower) {
    return { error: "Ese nombre de usuario ya está en uso." };
  }

  const hash = await hashContrasena(contrasena);
  const monedaPreferida = paisPorCodigo(pais)?.moneda ?? "USD";
  const data = {
    hashContrasena: hash,
    nombre,
    apellido,
    nombreUsuario,
    pais,
    monedaPreferida,
  };
  const usuario = existente
    ? await prisma.usuario.update({ where: { correo: correoLower }, data })
    : await prisma.usuario.create({ data: { correo: correoLower, ...data } });

  if (!existente) {
    await crearNotificacion(usuario.id, {
      tipo: "verificacion",
      titulo: "Completa tu verificación 🔐",
      cuerpo:
        "Agrega un método de seguridad (PIN o código por correo) para proteger tu cuenta.",
      enlace: "/configuracion?tab=verificacion",
    });
  }

  await crearYEnviarOtp(usuario.id, correoLower, "verificacion");
  await guardarPendiente(correoLower);
  redirect("/verificar");
}

export async function verificar(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = otpSchema.safeParse({ codigo: formData.get("codigo") });
  if (!datos.success) return { error: datos.error.issues[0].message };

  const correo = (await cookies()).get(PENDIENTE)?.value;
  if (!correo) {
    return { error: "La verificación expiró. Vuelve a iniciar el registro." };
  }
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return { error: "Usuario no encontrado." };

  const ok = await validarOtp(usuario.id, "verificacion", datos.data.codigo);
  if (!ok) return { error: "Código inválido o expirado." };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { correoVerificado: true, ingresos: { increment: 1 } },
  });
  (await cookies()).delete(PENDIENTE);
  await crearSesion(usuario.id);
  // Tras crear la cuenta siempre se muestra el introductorio.
  redirect("/onboarding");
}

export async function reenviarCodigo(): Promise<void> {
  const correo = (await cookies()).get(PENDIENTE)?.value;
  if (!correo) return;
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (usuario) await crearYEnviarOtp(usuario.id, correo, "verificacion");
}

export async function iniciarSesion(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = loginSchema.safeParse({
    identificador: formData.get("identificador"),
    contrasena: formData.get("contrasena"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { identificador, contrasena } = datos.data;

  const usuario = await prisma.usuario.findFirst({
    where: {
      OR: [
        { correo: identificador.toLowerCase() },
        { nombreUsuario: identificador },
      ],
    },
  });
  if (
    !usuario?.hashContrasena ||
    !(await verificarContrasena(usuario.hashContrasena, contrasena))
  ) {
    return { error: "Correo/usuario o contraseña incorrectos." };
  }

  if (!usuario.correoVerificado) {
    await crearYEnviarOtp(usuario.id, usuario.correo, "verificacion");
    await guardarPendiente(usuario.correo);
    redirect("/verificar");
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ingresos: { increment: 1 } },
  });
  await crearSesion(usuario.id);
  redirect(debeMostrarOnboarding(actualizado) ? "/onboarding" : "/dashboard");
}

export async function cerrarSesionAction() {
  await cerrarSesion();
  redirect("/login");
}

/**
 * Cierra el introductorio y lleva al dashboard.
 * Si `noMostrarMas` es true, lo descarta por completo (no se vuelve a mostrar);
 * si no, solo cuenta un cierre más.
 */
export async function cerrarOnboarding(noMostrarMas?: boolean) {
  const usuario = await obtenerUsuario();
  if (usuario) {
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: noMostrarMas
        ? { onboardingCerrado: 3 }
        : { onboardingCerrado: { increment: 1 } },
    });
  }
  redirect("/dashboard");
}
