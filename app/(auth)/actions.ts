"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { hashContrasena, verificarContrasena } from "@/lib/auth/password";
import { crearYEnviarOtp, validarOtp } from "@/lib/auth/otp";
import { crearSesion, cerrarSesion } from "@/lib/auth/session";
import { registroSchema, loginSchema, otpSchema } from "@/lib/validations/auth";

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
  const datos = registroSchema.safeParse({
    correo: formData.get("correo"),
    contrasena: formData.get("contrasena"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { correo, contrasena } = datos.data;

  const existente = await prisma.usuario.findUnique({ where: { correo } });
  if (existente?.correoVerificado) {
    return { error: "Ese correo ya está registrado." };
  }

  const hash = await hashContrasena(contrasena);
  const usuario = existente
    ? await prisma.usuario.update({
        where: { correo },
        data: { hashContrasena: hash },
      })
    : await prisma.usuario.create({ data: { correo, hashContrasena: hash } });

  await crearYEnviarOtp(usuario.id, correo, "verificacion");
  await guardarPendiente(correo);
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
    data: { correoVerificado: true },
  });
  (await cookies()).delete(PENDIENTE);
  await crearSesion(usuario.id);
  redirect("/dashboard");
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
    correo: formData.get("correo"),
    contrasena: formData.get("contrasena"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { correo, contrasena } = datos.data;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (
    !usuario?.hashContrasena ||
    !(await verificarContrasena(usuario.hashContrasena, contrasena))
  ) {
    return { error: "Correo o contraseña incorrectos." };
  }

  if (!usuario.correoVerificado) {
    await crearYEnviarOtp(usuario.id, correo, "verificacion");
    await guardarPendiente(correo);
    redirect("/verificar");
  }

  await crearSesion(usuario.id);
  redirect("/dashboard");
}

export async function cerrarSesionAction() {
  await cerrarSesion();
  redirect("/login");
}
