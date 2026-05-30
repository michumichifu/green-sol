"use client";

import { useState } from "react";
import type { Tasas } from "@/lib/rates/cache";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const MONEDAS = [
  { id: "bs", nombre: "Bolívares", simbolo: "Bs" },
  { id: "bcv", nombre: "Dólar BCV", simbolo: "$" },
  { id: "usdt", nombre: "USDT", simbolo: "USDT" },
  { id: "sol", nombre: "Solana", simbolo: "SOL" },
] as const;
type Moneda = (typeof MONEDAS)[number]["id"];

function fmt(n: number) {
  return n.toLocaleString("es-VE", {
    maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 6 : 2,
  });
}

export function Calculadora({ tasas }: { tasas: Tasas }) {
  const [monto, setMonto] = useState("1");
  const [moneda, setMoneda] = useState<Moneda>("bs");
  const n = Number(monto) || 0;

  const bcv = tasas.bcv?.usd ?? 0; // Bs por dólar BCV
  const usdt = tasas.usdt?.promedio ?? 0; // Bs por USDT (paralelo)
  const sol = tasas.sol?.usd ?? 0; // USD por SOL
  const usdtBs = usdt || bcv; // referencia en Bs para cripto (cae a BCV si no hay USDT)

  // Valor de 1 unidad de cada moneda en bolívares.
  const valorBs: Record<Moneda, number> = {
    bs: 1,
    bcv,
    usdt: usdtBs,
    sol: sol * usdtBs,
  };

  const convertir = (destino: Moneda): number | null => {
    const vo = valorBs[moneda];
    const vd = valorBs[destino];
    if (!vo || !vd) return null;
    return (n * vo) / vd;
  };

  const cotizacion = (): string => {
    switch (moneda) {
      case "bs":
        return `BCV: Bs ${fmt(bcv)} · USDT: Bs ${fmt(usdt)}`;
      case "bcv":
        return `1 $ BCV = Bs ${fmt(bcv)}`;
      case "usdt":
        return `1 USDT = Bs ${fmt(usdtBs)}`;
      case "sol":
        return `1 SOL = $ ${fmt(sol)}`;
    }
  };

  const actual = MONEDAS.find((m) => m.id === moneda)!;

  return (
    <div className="space-y-4">
      {/* 1. Elegir moneda */}
      <div className="space-y-2">
        <p className="text-sm font-medium">¿Qué moneda quieres convertir?</p>
        <div className="grid grid-cols-4 gap-2">
          {MONEDAS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMoneda(m.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors",
                moneda === m.id
                  ? "border-brand bg-brand/5"
                  : "hover:border-brand/40",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
                  moneda === m.id
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {m.simbolo}
              </span>
              <span className="text-center text-[11px] font-medium leading-tight">
                {m.nombre}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Monto con símbolo + cotización */}
      <div className="space-y-1.5">
        <label htmlFor="monto" className="text-sm font-medium">
          Monto en {actual.nombre}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-brand">
            {actual.simbolo}
          </span>
          <Input
            id="monto"
            type="number"
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={cn(
              "h-10 text-base",
              actual.simbolo.length > 2 ? "pl-14" : "pl-10",
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Cotización de hoy · {cotizacion()}
        </p>
      </div>

      {/* 3. Resultados */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Equivale a</p>
        {MONEDAS.filter((m) => m.id !== moneda).map((m) => {
          const v = convertir(m.id);
          return (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border bg-card p-3"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                  {m.simbolo}
                </span>
                <span className="text-sm font-medium">{m.nombre}</span>
              </span>
              <span className="font-bold">
                {v === null ? "—" : `${m.simbolo} ${fmt(v)}`}
              </span>
            </div>
          );
        })}
      </div>

      {!tasas.actualizado && (
        <p className="text-xs text-muted-foreground">
          Aún no hay tasas cargadas. Se actualizan automáticamente; en
          desarrollo, ejecuta el cron de tasas.
        </p>
      )}
    </div>
  );
}
