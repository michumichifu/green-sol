/**
 * Planificador de tasas — corre en el proceso del servidor Node.js.
 * Iniciado una sola vez desde instrumentation.ts al arrancar Next.js.
 *
 * Frecuencias:
 *   - SOL + USDT ("cripto"): cada 30 minutos.
 *   - BCV: a las 6, 11, 14 y 19 hora de Venezuela (America/Caracas),
 *     una sola vez por slot (no se repite si el intervalo cae varias
 *     veces dentro de la misma hora).
 */

import { refrescarTasas } from "./cache";

let iniciado = false;

/** Devuelve la hora actual en America/Caracas (0-23). */
function horaCaracas(): number {
  const str = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  return parseInt(str, 10);
}

const HORAS_BCV = new Set([6, 11, 14, 19]);
const INTERVALO_MS = 30 * 60 * 1000; // 30 minutos

export function iniciarSchedulerTasas(): void {
  if (iniciado) return;
  iniciado = true;

  console.log("[scheduler-tasas] Iniciando — refresco inicial...");

  // Refresco inicial al arrancar (no bloquea el arranque del servidor).
  refrescarTasas("todo").catch((e: Error) =>
    console.error("[scheduler-tasas] Error en refresco inicial:", e.message),
  );

  let ultimaHoraBcv = -1;

  setInterval(() => {
    // Cripto siempre (cada 30 min).
    refrescarTasas("cripto").catch((e: Error) =>
      console.error("[scheduler-tasas] Error refrescando cripto:", e.message),
    );

    // BCV solo en los slots definidos y sin repetir dentro de la misma hora.
    const hora = horaCaracas();
    if (HORAS_BCV.has(hora) && hora !== ultimaHoraBcv) {
      ultimaHoraBcv = hora;
      refrescarTasas("bcv").catch((e: Error) =>
        console.error("[scheduler-tasas] Error refrescando BCV:", e.message),
      );
    }
  }, INTERVALO_MS);

  console.log(
    `[scheduler-tasas] Planificador activo — cripto cada 30 min, BCV a las ${[...HORAS_BCV].join("/")}h VE.`,
  );
}
