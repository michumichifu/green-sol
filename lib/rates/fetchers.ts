// Consulta las APIs externas de tasas y normaliza la respuesta.
// BCV: CDN público (sin key). USDT: API privada (requiere key). SOL: DexScreener (público).

const BCV_URL = "https://rates.dolarvzla.com/bcv/current.json";
const USDT_URL = "https://api.dolarvzla.com/public/usdt/exchange-rate";
const SOL_URL =
  "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112";

export type TasaBcv = {
  usd: number;
  eur: number;
  fecha: string;
  variacionUsd: number | null;
};
export type TasaUsdt = {
  promedio: number;
  compra: number;
  venta: number;
  variacion: number | null;
};
export type TasaSol = { usd: number };

interface BcvRaw {
  current?: { usd?: number; eur?: number; date?: string };
  changePercentage?: { usd?: number };
}
interface UsdtRaw {
  current?: { average?: number; buy?: number; sell?: number };
  changePercentage?: { average?: number };
}
interface DexPair {
  priceUsd?: string;
  liquidity?: { usd?: number };
}
interface DexRaw {
  pairs?: DexPair[];
}

export async function fetchBcv(): Promise<TasaBcv> {
  const res = await fetch(BCV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("BCV no disponible");
  const j = (await res.json()) as BcvRaw;
  return {
    usd: j.current?.usd ?? 0,
    eur: j.current?.eur ?? 0,
    fecha: j.current?.date ?? "",
    variacionUsd: j.changePercentage?.usd ?? null,
  };
}

export async function fetchUsdt(): Promise<TasaUsdt | null> {
  const key = process.env.DOLARVZLA_API_KEY;
  if (!key) return null;
  const res = await fetch(USDT_URL, {
    headers: { "x-dolarvzla-key": key },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const j = (await res.json()) as UsdtRaw;
  return {
    promedio: j.current?.average ?? 0,
    compra: j.current?.buy ?? 0,
    venta: j.current?.sell ?? 0,
    variacion: j.changePercentage?.average ?? null,
  };
}

export async function fetchSol(): Promise<TasaSol> {
  const res = await fetch(SOL_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("DexScreener no disponible");
  const j = (await res.json()) as DexRaw;
  const pares = (j.pairs ?? []).filter((p) => p.priceUsd);
  pares.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
  const precio = pares[0]?.priceUsd ? Number(pares[0].priceUsd) : 0;
  return { usd: precio };
}
