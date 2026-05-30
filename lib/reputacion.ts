import { prisma } from "@/lib/db";

export type Reputacion = {
  positivos: number;
  negativos: number;
  total: number;
  estrellas: number; // 0–5
};

/** Reputación de un usuario a partir de sus valoraciones recibidas. */
export async function obtenerReputacion(
  usuarioId: string,
): Promise<Reputacion> {
  const valoraciones = await prisma.valoracion.findMany({
    where: { aUsuarioId: usuarioId },
  });
  const positivos = valoraciones.filter((v) => v.voto > 0).length;
  const negativos = valoraciones.filter((v) => v.voto < 0).length;
  const total = positivos + negativos;
  const estrellas =
    total === 0 ? 0 : Math.round((positivos / total) * 5 * 10) / 10;
  return { positivos, negativos, total, estrellas };
}

export type Nivel = {
  nombre: string;
  min: number;
  indice: number;
};

// Niveles por puntos acumulados (valoraciones positivas).
const NIVELES: { nombre: string; min: number }[] = [
  { nombre: "Nuevo", min: 0 },
  { nombre: "Confiable", min: 5 },
  { nombre: "Destacado", min: 15 },
  { nombre: "Estrella", min: 30 },
  { nombre: "Leyenda", min: 60 },
];

/** Nivel actual, progreso y meta del siguiente, a partir de los puntos (positivos). */
export function nivelPorReputacion(rep: Reputacion) {
  const puntos = rep.positivos;
  let indice = 0;
  for (let i = 0; i < NIVELES.length; i++) {
    if (puntos >= NIVELES[i].min) indice = i;
  }
  const actual: Nivel = { ...NIVELES[indice], indice };
  const siguiente =
    indice < NIVELES.length - 1
      ? { ...NIVELES[indice + 1], indice: indice + 1 }
      : null;
  const faltan = siguiente ? siguiente.min - puntos : 0;
  const progreso = siguiente
    ? Math.min(
        100,
        Math.round(
          ((puntos - actual.min) / (siguiente.min - actual.min)) * 100,
        ),
      )
    : 100;
  return { puntos, actual, siguiente, faltan, progreso };
}
