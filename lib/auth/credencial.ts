import { verify } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { verificarContrasena } from "@/lib/auth/password";

/**
 * Valida la credencial de un usuario: primero intenta como PIN (si lo tiene),
 * luego como contraseña. Devuelve true si alguna coincide.
 * No aplica bloqueo por intentos: se usa solo en contextos de super-admin
 * donde el bloqueo accidental sería un problema operativo.
 */
export async function credencialValida(
  usuarioId: string,
  credencial: string,
): Promise<boolean> {
  if (!credencial?.trim()) return false;
  const u = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!u) return false;
  if (u.pinHash && (await verify(u.pinHash, credencial))) return true;
  if (u.hashContrasena && (await verificarContrasena(u.hashContrasena, credencial))) return true;
  return false;
}
