import { prisma } from "@/lib/db";
import { hashContrasena, verificarContrasena } from "@/lib/auth/password";

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
const PINS_TRIVIALES = new Set(["000000", "111111", "123456", "654321", "121212"]);

/** True si el PIN tiene formato válido (6 dígitos, no trivial). */
export function pinFormatoValido(pin: string): boolean {
  return /^\d{6}$/.test(pin) && !PINS_TRIVIALES.has(pin);
}

export function hashearPin(pin: string): Promise<string> {
  return hashContrasena(pin);
}

export type ResultadoPin =
  | { ok: true }
  | { ok: false; error: string; bloqueadoHasta?: Date };

/** Verifica el PIN aplicando bloqueo por intentos. Resetea intentos al acertar. */
export async function verificarPin(
  usuarioId: string,
  pin: string,
): Promise<ResultadoPin> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario?.pinHash) return { ok: false, error: "Esta cuenta no tiene PIN." };
  if (usuario.pinBloqueadoHasta && usuario.pinBloqueadoHasta > new Date()) {
    return {
      ok: false,
      error: "Demasiados intentos. Espera unos minutos.",
      bloqueadoHasta: usuario.pinBloqueadoHasta,
    };
  }
  const ok = await verificarContrasena(usuario.pinHash, pin);
  if (ok) {
    if (usuario.pinIntentos !== 0 || usuario.pinBloqueadoHasta) {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { pinIntentos: 0, pinBloqueadoHasta: null },
      });
    }
    return { ok: true };
  }
  const intentos = usuario.pinIntentos + 1;
  const bloquea = intentos >= MAX_INTENTOS;
  const bloqueadoHasta = bloquea
    ? new Date(Date.now() + BLOQUEO_MIN * 60_000)
    : null;
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      // Al bloquear reiniciamos el contador a 0: tras expirar el bloqueo el
      // usuario arranca un ciclo limpio de intentos (el bloqueo lo marca la fecha).
      pinIntentos: bloquea ? 0 : intentos,
      pinBloqueadoHasta: bloqueadoHasta,
    },
  });
  return bloquea
    ? {
        ok: false,
        error: "Demasiados intentos. Espera 15 minutos.",
        bloqueadoHasta: bloqueadoHasta!,
      }
    : {
        ok: false,
        error: `PIN incorrecto. Te quedan ${MAX_INTENTOS - intentos} intentos.`,
      };
}
