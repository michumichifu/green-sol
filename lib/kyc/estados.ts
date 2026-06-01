import type { EstadoKyc } from "@prisma/client";

/**
 * Máquina de estados del KYC. Las transiciones inválidas se bloquean aquí
 * (portado del modelo de TrustFlow, en TypeScript).
 *
 *   pendiente → en_revision → aprobada | rechazada | reenvio_solicitado | baneada
 *
 * `reenvio_solicitado` no transiciona: el reenvío crea un NUEVO intento
 * (otra fila VerificacionKyc en `pendiente`).
 */
export const TRANSICIONES: Record<EstadoKyc, EstadoKyc[]> = {
  pendiente: ["en_revision"],
  en_revision: ["aprobada", "rechazada", "reenvio_solicitado", "baneada"],
  reenvio_solicitado: [],
  aprobada: [],
  rechazada: [],
  baneada: [],
};

export function puedeTransicionar(
  actual: EstadoKyc,
  siguiente: EstadoKyc,
): boolean {
  return TRANSICIONES[actual]?.includes(siguiente) ?? false;
}

/** Estados en los que el usuario NO puede enviar un nuevo intento (hay uno en curso). */
export const ESTADOS_EN_CURSO: EstadoKyc[] = ["pendiente", "en_revision"];
