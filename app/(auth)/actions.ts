"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { crearYEnviarOtp, validarOtp } from "@/lib/auth/otp";
import { crearNotificacion } from "@/lib/notificaciones";
import { crearSesion, cerrarSesion, obtenerUsuario } from "@/lib/auth/session";
import { debeMostrarOnboarding } from "@/lib/onboarding";
import { validarRestricciones } from "@/lib/restricciones";
import { verificarPin, hashearPin, pinFormatoValido } from "@/lib/auth/pin";
import { verificarContrasena } from "@/lib/auth/password";
import {
  pinSchema,
  registroDatosSchema,
  loginPinSchema,
  otpSchema,
} from "@/lib/validations/auth";
import { paisPorCodigo } from "@/lib/paises";
import { SENAL_MIGRAR_PIN, COOKIE_PENDIENTE as PENDIENTE } from "./constants";

export type EstadoAuth = { error?: string };

/** Busca un usuario por correo (case-insensitive) o por nombreUsuario (case-insensitive). */
async function buscarUsuarioPorIdentificador(identificador: string) {
  return prisma.usuario.findFirst({
    where: {
      OR: [
        { correo: identificador.toLowerCase() },
        { nombreUsuario: { equals: identificador, mode: "insensitive" } },
      ],
    },
  });
}

async function guardarPendiente(correo: string) {
  (await cookies()).set(PENDIENTE, correo, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1800,
  });
}

/**
 * Paso 1 del nuevo registro: solo el correo.
 * Crea un usuario pendiente (sin PIN ni datos) y envía OTP.
 */
export async function solicitarRegistro(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const correoRaw = String(formData.get("correo") ?? "").trim().toLowerCase();
  if (!correoRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoRaw)) {
    return { error: "Correo inválido." };
  }

  const existente = await prisma.usuario.findUnique({
    where: { correo: correoRaw },
  });
  if (existente?.correoVerificado) {
    return { error: "Ese correo ya tiene cuenta. Inicia sesión." };
  }

  // Crea o reutiliza el usuario pendiente (solo correo, sin PIN ni datos)
  const usuario = existente
    ? await prisma.usuario.update({
        where: { correo: correoRaw },
        data: { correoVerificado: false },
      })
    : await prisma.usuario.create({ data: { correo: correoRaw } });

  await crearYEnviarOtp(usuario.id, correoRaw, "verificacion");
  await guardarPendiente(correoRaw);
  redirect("/verificar");
}

/**
 * Valida el OTP.
 * - Si el usuario NO tiene PIN (registro en curso): redirige a /registro (paso PIN).
 * - Si el usuario SÍ tiene PIN (era un login con correo no verificado): va al dashboard.
 */
export async function verificar(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = otpSchema.safeParse({ codigo: formData.get("codigo") });
  if (!datos.success) return { error: datos.error.issues[0].message };

  const correo = (await cookies()).get(PENDIENTE)?.value;
  if (!correo) {
    return { error: "La verificación expiró. Vuelve a iniciar el proceso." };
  }
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return { error: "Usuario no encontrado." };

  const ok = await validarOtp(usuario.id, "verificacion", datos.data.codigo);
  if (!ok) return { error: "Código inválido o expirado." };

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { correoVerificado: true },
  });

  // Distingue registro en curso (incompleto) vs login (registro completo)
  // "incompleto" = sin PIN o sin datos de perfil (nombreUsuario)
  if (!usuario.pinHash || !usuario.nombreUsuario) {
    // Registro en curso: la cookie PENDIENTE se mantiene para los siguientes pasos
    // detectarPasoInicial en /registro decidirá el paso correcto (2 o 3)
    redirect("/registro");
  }

  // Era un login con correo no verificado: iniciar sesión normalmente
  (await cookies()).delete(PENDIENTE);
  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ingresos: { increment: 1 } },
  });
  await crearSesion(usuario.id);
  redirect(debeMostrarOnboarding(actualizado) ? "/onboarding" : "/dashboard");
}

/**
 * Paso 2 del registro: define el PIN.
 * Identifica al usuario por la cookie PENDIENTE.
 */
export async function definirPinRegistro(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = pinSchema.safeParse({
    pin: formData.get("pin"),
    confirmar: formData.get("confirmar"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { pin } = datos.data;

  if (!pinFormatoValido(pin)) {
    return { error: "Ese PIN es demasiado sencillo. Elige uno más seguro." };
  }

  const correo = (await cookies()).get(PENDIENTE)?.value;
  if (!correo) {
    return { error: "La sesión de registro expiró. Vuelve a empezar." };
  }
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (!usuario.correoVerificado) {
    return { error: "Primero verifica tu correo." };
  }

  const pinHash = await hashearPin(pin);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { pinHash },
  });

  return {};
}

/**
 * Paso 3 del registro: completa los datos del perfil.
 */
export async function completarRegistro(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const datos = registroDatosSchema.safeParse({
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    nombreUsuario: formData.get("nombreUsuario"),
    pais: formData.get("pais"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { nombre, apellido, nombreUsuario, pais } = datos.data;

  const errorRest = await validarRestricciones({ nombre, apellido, nombreUsuario });
  if (errorRest) return { error: errorRest };

  const correo = (await cookies()).get(PENDIENTE)?.value;
  if (!correo) {
    return { error: "La sesión de registro expiró. Vuelve a empezar." };
  }
  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return { error: "Usuario no encontrado." };
  if (!usuario.correoVerificado || !usuario.pinHash) {
    return { error: "Completa los pasos anteriores primero." };
  }

  // Unicidad del nombre de usuario (case-insensitive)
  const userExistente = await prisma.usuario.findFirst({
    where: { nombreUsuario: { equals: nombreUsuario, mode: "insensitive" } },
  });
  if (userExistente && userExistente.correo !== correo) {
    return { error: "Ese nombre de usuario ya está en uso." };
  }

  const monedaPreferida = paisPorCodigo(pais)?.moneda ?? "USD";
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { nombre, apellido, nombreUsuario, pais, monedaPreferida },
  });

  // Notificación de bienvenida: ya tienes PIN, el siguiente paso es verificar tu identidad (KYC).
  await crearNotificacion(usuario.id, {
    tipo: "verificacion",
    titulo: "¡Bienvenido a Green Sol! 🎉",
    cuerpo:
      "Tu cuenta está lista. Para acceder a todas las funciones, completa tu verificación de identidad.",
    enlace: "/configuracion?tab=verificacion",
  });

  // Limpia la cookie pendiente
  (await cookies()).delete(PENDIENTE);

  redirect("/registro/completado");
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
  const datos = loginPinSchema.safeParse({
    identificador: formData.get("identificador"),
    pin: formData.get("pin"),
  });
  if (!datos.success) return { error: datos.error.issues[0].message };
  const { identificador, pin } = datos.data;

  const usuario = await buscarUsuarioPorIdentificador(identificador);
  if (!usuario) return { error: "Correo/usuario o PIN incorrectos." };

  if (!usuario.pinHash) return { error: SENAL_MIGRAR_PIN };

  const r = await verificarPin(usuario.id, pin);
  if (!r.ok) return { error: r.error };

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
 * Migración de contraseña → PIN.
 * Para usuarios que tienen `hashContrasena` pero aún no tienen `pinHash`.
 * Verifica la contraseña actual, guarda el nuevo PIN y abre sesión.
 * CONSERVA `hashContrasena` (factor fuerte para operaciones cripto).
 */
export async function crearPinMigracion(
  _estado: EstadoAuth,
  formData: FormData,
): Promise<EstadoAuth> {
  const identificador = String(formData.get("identificador") ?? "").trim();
  const contrasena = String(formData.get("contrasena") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (!identificador) return { error: "Falta el identificador de cuenta." };

  const usuario = await buscarUsuarioPorIdentificador(identificador);
  if (!usuario) return { error: "No encontramos esa cuenta. Intenta de nuevo." };

  // Si ya tiene PIN no debe estar aquí
  if (usuario.pinHash) {
    redirect("/login");
  }

  // Verificar contraseña actual
  if (!usuario.hashContrasena) {
    return { error: "Esta cuenta no puede completar la migración. Contacta soporte." };
  }
  const contrasenaOk = await verificarContrasena(usuario.hashContrasena, contrasena);
  if (!contrasenaOk) return { error: "Contraseña incorrecta." };

  // Validar PIN
  const datosParsed = pinSchema.safeParse({ pin, confirmar });
  if (!datosParsed.success) return { error: datosParsed.error.issues[0].message };
  if (!pinFormatoValido(pin)) {
    return { error: "Ese PIN es demasiado sencillo. Elige uno más seguro." };
  }

  // Guardar pinHash; se conserva hashContrasena
  const pinHash = await hashearPin(pin);
  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { pinHash, ingresos: { increment: 1 } },
  });

  await crearSesion(usuario.id);
  redirect(debeMostrarOnboarding(actualizado) ? "/onboarding" : "/dashboard");
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
