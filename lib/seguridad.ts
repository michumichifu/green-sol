import { prisma } from "@/lib/db";
import { verificarContrasena } from "@/lib/auth/password";
import { validarOtp } from "@/lib/auth/otp";

export type Factores = {
  clave?: string;
  pin?: string;
  otpCorreo?: string;
};

export type FactoresActivos = {
  pin: boolean;
  otpCorreo: boolean;
};

/** Qué segundos factores tiene activos el usuario (para pedir solo esos). */
export async function factoresActivos(
  usuarioId: string,
): Promise<FactoresActivos> {
  const u = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { pinHash: true, otpCorreoActivo: true },
  });
  return { pin: !!u?.pinHash, otpCorreo: !!u?.otpCorreoActivo };
}

/**
 * Verifica los factores de seguridad antes de una acción sensible.
 * - **Clave de la cuenta:** siempre obligatoria.
 * - **PIN:** solo si el usuario lo configuró.
 * - **OTP por correo:** solo si el usuario lo activó (se envía aparte y se valida aquí).
 *
 * El segundo factor solo se exige si el usuario lo tiene activo (público retail).
 * A futuro: TOTP (Google Authenticator) y biometría (WebAuthn) se suman aquí.
 */
export async function verificarFactores(
  usuarioId: string,
  factores: Factores,
): Promise<{ ok: boolean; error?: string }> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario?.hashContrasena) {
    return { ok: false, error: "Tu cuenta no tiene clave configurada." };
  }

  // 1) Clave (siempre).
  if (!factores.clave) {
    return { ok: false, error: "Ingresa tu clave para confirmar." };
  }
  if (!(await verificarContrasena(usuario.hashContrasena, factores.clave))) {
    return { ok: false, error: "Clave incorrecta." };
  }

  // 2) PIN (si está activo).
  if (usuario.pinHash) {
    if (!factores.pin) return { ok: false, error: "Ingresa tu PIN." };
    if (!(await verificarContrasena(usuario.pinHash, factores.pin))) {
      return { ok: false, error: "PIN incorrecto." };
    }
  }

  // 3) OTP por correo (si está activo).
  if (usuario.otpCorreoActivo) {
    if (!factores.otpCorreo) {
      return { ok: false, error: "Ingresa el código enviado a tu correo." };
    }
    const ok = await validarOtp(usuarioId, "verificacion", factores.otpCorreo);
    if (!ok) return { ok: false, error: "Código incorrecto o vencido." };
  }

  return { ok: true };
}
