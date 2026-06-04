// Lógica del ciclo de rondas del san: fechas de corte, puntualidad, mora y estado de la ronda.

export type Puntualidad = "a_tiempo" | "adelantado" | "mora";

/** Fecha de corte (vencimiento) de una ronda = inicio + (ronda − 1) × frecuencia. */
export function fechaCorte(
  fechaInicio: Date | string,
  ronda: number,
  diasFrecuencia: number,
): Date {
  const d = new Date(fechaInicio);
  d.setDate(d.getDate() + (ronda - 1) * diasFrecuencia);
  return d;
}

/** Compara (por día) la fecha del pago con la de corte: antes = adelantado, igual = a tiempo, después = mora. */
export function puntualidad(
  fechaPago: Date | string,
  corte: Date | string,
): Puntualidad {
  const p = new Date(fechaPago);
  p.setHours(0, 0, 0, 0);
  const c = new Date(corte);
  c.setHours(0, 0, 0, 0);
  if (p.getTime() > c.getTime()) return "mora";
  if (p.getTime() < c.getTime()) return "adelantado";
  return "a_tiempo";
}

/** Penalización por mora según la política del san, sobre la cuota (en la moneda ancla). */
export function montoMora(
  moraTipo: string,
  moraValor: number | null,
  cuotaAncla: number,
): number {
  if (moraTipo === "fijo") return moraValor ?? 0;
  if (moraTipo === "porcentaje") return (cuotaAncla * (moraValor ?? 0)) / 100;
  return 0;
}

export const PUNTUALIDAD_LABEL: Record<Puntualidad, string> = {
  a_tiempo: "A tiempo",
  adelantado: "Adelantado",
  mora: "Con atraso",
};

type TurnoMin = { participanteId: string; posicion: number; cobrado: boolean };
type AporteMin = { participanteId: string; ronda: number; estado: string };

export type EstadoRonda = {
  rondaActual: number;
  totalRondas: number;
  aportantes: number; // cuántos deben aportar cada ronda (= nº de turnos)
  pagadosRonda: number; // cuántos confirmaron su cuota en la ronda actual
  completa: boolean; // todos los aportantes pagaron la ronda actual
  cobradorParticipanteId: string | null; // a quién le toca cobrar esta ronda
  entregada: boolean; // el organizador ya entregó el bote de esta ronda
  finalizado: boolean; // se entregaron todos los turnos
};

/** Deriva el estado de la ronda actual a partir de turnos y aportes. */
export function estadoRonda(
  rondaActual: number,
  turnos: TurnoMin[],
  aportes: AporteMin[],
): EstadoRonda {
  const totalRondas = turnos.length;
  const aportantes = turnos.length;
  const pagadores = new Set(
    aportes
      .filter((a) => a.ronda === rondaActual && a.estado === "confirmado")
      .map((a) => a.participanteId),
  );
  const pagadosRonda = pagadores.size;
  const cobrador = turnos.find((t) => t.posicion === rondaActual) ?? null;
  return {
    rondaActual,
    totalRondas,
    aportantes,
    pagadosRonda,
    completa: aportantes > 0 && pagadosRonda >= aportantes,
    cobradorParticipanteId: cobrador?.participanteId ?? null,
    entregada: cobrador?.cobrado ?? false,
    finalizado: turnos.length > 0 && turnos.every((t) => t.cobrado),
  };
}
