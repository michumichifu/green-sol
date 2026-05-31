import { prisma } from "@/lib/db";
import { verificarContrasena } from "@/lib/auth/password";

export type Factores = {
  clave?: string;
  // A futuro: otpCorreo?, totp? (Google Authenticator), pin?, biometria?…
};

/**
 * Verifica los factores de seguridad del usuario antes de una acción sensible
 * (agregar/editar/eliminar método de pago, etc.).
 *
 * Hoy el factor es la **clave de la cuenta**. El diseño permite sumar más
 * factores (OTP por correo, TOTP de Google Authenticator, PIN, biometría)
 * sin tocar las acciones que lo usan: se agregan aquí.
 */
export async function verificarFactores(
  usuarioId: string,
  factores: Factores,
): Promise<{ ok: boolean; error?: string }> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario?.hashContrasena) {
    return { ok: false, error: "Tu cuenta no tiene clave configurada." };
  }
  if (!factores.clave) {
    return { ok: false, error: "Ingresa tu clave para confirmar." };
  }
  const ok = await verificarContrasena(usuario.hashContrasena, factores.clave);
  if (!ok) return { ok: false, error: "Clave incorrecta." };
  return { ok: true };
}
