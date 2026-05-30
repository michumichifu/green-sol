import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  fetchBcv,
  fetchUsdt,
  fetchSol,
  type TasaBcv,
  type TasaUsdt,
  type TasaSol,
} from "./fetchers";

async function guardar(fuente: string, datos: Prisma.InputJsonValue) {
  await prisma.tasaCache.upsert({
    where: { fuente },
    create: { fuente, datos },
    update: { datos, actualizado: new Date() },
  });
}

/** Consulta las APIs y actualiza el caché. Pensado para el cron. */
export async function refrescarTasas() {
  const resultado: Record<string, string> = {};
  const tareas = [
    fetchBcv()
      .then((d) => guardar("bcv", d))
      .then(() => (resultado.bcv = "ok"))
      .catch((e) => (resultado.bcv = `error: ${e.message}`)),
    fetchUsdt()
      .then((d) => (d ? guardar("usdt", d).then(() => (resultado.usdt = "ok")) : (resultado.usdt = "sin key")))
      .catch((e) => (resultado.usdt = `error: ${e.message}`)),
    fetchSol()
      .then((d) => guardar("sol", d))
      .then(() => (resultado.sol = "ok"))
      .catch((e) => (resultado.sol = `error: ${e.message}`)),
  ];
  await Promise.allSettled(tareas);
  return resultado;
}

export type Tasas = {
  bcv: TasaBcv | null;
  usdt: TasaUsdt | null;
  sol: TasaSol | null;
  actualizado: string | null;
};

/** Lee las tasas del caché (lo que usan el dashboard y la calculadora). */
export async function obtenerTasas(): Promise<Tasas> {
  const filas = await prisma.tasaCache.findMany();
  const map = new Map(filas.map((f) => [f.fuente, f]));
  const leer = <T>(fuente: string): T | null =>
    (map.get(fuente)?.datos as T | undefined) ?? null;
  return {
    bcv: leer<TasaBcv>("bcv"),
    usdt: leer<TasaUsdt>("usdt"),
    sol: leer<TasaSol>("sol"),
    actualizado: filas.length
      ? new Date(
          Math.max(...filas.map((f) => f.actualizado.getTime())),
        ).toISOString()
      : null,
  };
}
