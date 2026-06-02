import type { Tasas } from "@/lib/rates/cache";
import { MONEDA_RECOLECTA } from "@/lib/validations/recolecta";

/** Aporte por persona en la moneda-ancla (san: meta por turno / cupo; vaca: meta / cupo). */
export function aportePersona(montoAporte: number, cupo: number | null): number {
  if (!cupo || cupo <= 0) return montoAporte;
  return montoAporte / cupo;
}

export type InfoMonto = {
  enBolivares: boolean;
  ancla: string;            // "$" | "USDC" | "SOL"
  montoAncla: number;       // monto por persona en la moneda-ancla
  tasa: number | null;      // Bs por unidad-ancla (solo si enBolivares)
  fuenteTasa: string | null;// "dólar BCV" | "USDC/promedio" | null
  montoBs: number | null;   // montoAncla * tasa (solo si enBolivares y hay tasa)
};

/** Lo que paga un participante: en la ancla y, si aplica, en Bs a la tasa del día. */
export function infoMontoParticipante(
  moneda: string,
  montoAnclaPersona: number,
  tasas: Tasas,
): InfoMonto {
  const def = MONEDA_RECOLECTA[moneda];
  const ancla = def?.ancla ?? "$";
  const enBolivares = def?.enBolivares ?? false;
  let tasa: number | null = null;
  let fuenteTasa: string | null = null;
  if (enBolivares) {
    if (moneda === "bs_bcv") { tasa = tasas.bcv?.usd ?? null; fuenteTasa = "dólar BCV"; }
    else if (moneda === "bs_usdt") { tasa = tasas.usdt?.promedio ?? null; fuenteTasa = "USDC/promedio"; }
  }
  return {
    enBolivares, ancla, montoAncla: montoAnclaPersona, tasa, fuenteTasa,
    montoBs: enBolivares && tasa ? montoAnclaPersona * tasa : null,
  };
}
