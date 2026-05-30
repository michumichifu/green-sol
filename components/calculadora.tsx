"use client";

import { useState } from "react";
import type { Tasas } from "@/lib/rates/cache";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MONEDAS = [
  { id: "usdc", label: "USDC / USD" },
  { id: "sol", label: "SOL" },
  { id: "bs_bcv", label: "Bs (BCV)" },
  { id: "bs_usdt", label: "Bs (USDT)" },
] as const;
type Moneda = (typeof MONEDAS)[number]["id"];

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 4 });
}

function toUsd(
  n: number,
  moneda: Moneda,
  t: { bcv: number; usdt: number; sol: number },
): number {
  switch (moneda) {
    case "usdc":
      return n;
    case "sol":
      return n * t.sol;
    case "bs_bcv":
      return t.bcv ? n / t.bcv : 0;
    case "bs_usdt":
      return t.usdt ? n / t.usdt : 0;
  }
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{valor}</span>
    </div>
  );
}

export function Calculadora({ tasas }: { tasas: Tasas }) {
  const [monto, setMonto] = useState("1");
  const [moneda, setMoneda] = useState<Moneda>("usdc");
  const n = Number(monto) || 0;

  const bcv = tasas.bcv?.usd ?? 0;
  const usdt = tasas.usdt?.promedio ?? 0;
  const sol = tasas.sol?.usd ?? 0;

  const usd = toUsd(n, moneda, { bcv, usdt, sol });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="monto">Monto</Label>
        <Input
          id="monto"
          type="number"
          inputMode="decimal"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {MONEDAS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMoneda(m.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              moneda === m.id
                ? "border-brand bg-brand/10 text-brand"
                : "text-muted-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="space-y-2 rounded-xl border bg-card p-4">
        <Fila label="USDC / USD" valor={fmt(usd)} />
        <Fila label="SOL" valor={sol ? fmt(usd / sol) : "—"} />
        <Fila label="Bs (BCV)" valor={bcv ? fmt(usd * bcv) : "—"} />
        <Fila label="Bs (USDT)" valor={usdt ? fmt(usd * usdt) : "—"} />
      </div>
      {!tasas.actualizado && (
        <p className="text-xs text-muted-foreground">
          Aún no hay tasas cargadas. Se actualizan automáticamente; en desarrollo,
          ejecuta el cron de tasas.
        </p>
      )}
    </div>
  );
}
