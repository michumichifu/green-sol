"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { infoMontoParticipante } from "@/lib/san/montos";
import type { Tasas } from "@/lib/rates/cache";

type Aporte = {
  id: string;
  monto: number;
  montoAncla: number | null;
  fechaPago: Date | null;
  referencia: string | null;
  estado: "reportado" | "confirmado" | "rechazado";
  creadoEn: Date;
};

type Recolecta = {
  id: string;
  moneda: string;
  montoAporte: number | null;
  cupoMiembros: number | null;
};

interface PagosParticipanteProps {
  recolecta: Recolecta;
  tasas: Tasas;
  misAportes: Aporte[];
  reportar: (formData: FormData) => void;
}

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

const ESTADO_CONFIG: Record<
  "reportado" | "confirmado" | "rechazado",
  { label: string; className: string }
> = {
  reportado: {
    label: "En revisión",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmado: {
    label: "Aprobado",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rechazado: {
    label: "Rechazado",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

export function PagosParticipante({
  recolecta,
  tasas,
  misAportes,
  reportar,
}: PagosParticipanteProps) {
  // montoAporte ya es el aporte por persona ($100 meta ÷ 5 = $20); no se divide otra vez.
  const info = infoMontoParticipante(
    recolecta.moneda,
    recolecta.montoAporte ?? 0,
    tasas,
  );

  const montoBsSugerido =
    info.enBolivares && info.montoBs ? fmt(info.montoBs) : "";

  const [montoInput, setMontoInput] = useState(montoBsSugerido);
  // La fecha del pago por defecto es hoy (se setea en cliente para evitar mismatch de hidratación).
  const [fechaPago, setFechaPago] = useState("");
  const [hoy, setHoy] = useState("");
  useEffect(() => {
    const h = new Date().toISOString().slice(0, 10);
    setHoy(h);
    setFechaPago(h);
  }, []);

  const montoNumerico = parseFloat(montoInput.replace(/\./g, "").replace(",", ".")) || 0;
  const equivalenteUsd =
    info.enBolivares && info.tasa && montoNumerico > 0
      ? montoNumerico / info.tasa
      : null;

  const sortedAportes = [...misAportes].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
  );

  return (
    <div className="space-y-5">
      {/* Bloque 1: Lo que te toca pagar */}
      <div className="rounded-xl border bg-card p-4 space-y-1">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
          Lo que te toca pagar
        </p>

        {info.enBolivares && info.montoBs ? (
          <>
            <p className="text-2xl font-bold">
              Bs {fmt(info.montoBs)}
            </p>
            <p className="text-xs text-muted-foreground">
              ≈ ${fmt(info.montoAncla)}
              {info.fuenteTasa && info.tasa
                ? ` · ${info.fuenteTasa}: Bs ${fmt(info.tasa)}/$`
                : ""}
            </p>
          </>
        ) : info.enBolivares && !info.tasa ? (
          <>
            <p className="text-2xl font-bold">${fmt(info.montoAncla)}</p>
            <p className="mt-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Tasa no disponible hoy; calcula con la tasa del día.
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">
              {fmt(info.montoAncla)} {info.ancla}
            </p>
            <p className="text-xs text-muted-foreground">
              Se paga por tu wallet (Solana).
            </p>
          </>
        )}
      </div>

      {/* Bloque 2: Reportar pago */}
      <form action={reportar} className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Reportar pago</h2>

        <div className="space-y-1">
          <Label htmlFor="monto-input">¿Cuánto pagaste?</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              {info.enBolivares && (
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  Bs
                </span>
              )}
              <Input
                id="monto-input"
                name="monto"
                type="text"
                inputMode="decimal"
                placeholder={info.enBolivares ? "0,00" : `0.00 ${info.ancla}`}
                value={montoInput}
                onChange={(e) => setMontoInput(e.target.value)}
                className={info.enBolivares ? "pl-8" : ""}
                required
              />
            </div>
            {equivalenteUsd !== null && (
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                ≈ ${fmt(equivalenteUsd)}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="fecha-pago-input">Fecha del pago</Label>
          <Input
            id="fecha-pago-input"
            name="fechaPago"
            type="date"
            value={fechaPago}
            max={hoy}
            onChange={(e) => setFechaPago(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            El día en que hiciste el pago (puede ser distinto a hoy).
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="referencia-input">Referencia / nº de operación</Label>
          <Input
            id="referencia-input"
            name="referencia"
            placeholder="Ej: 00123456"
          />
        </div>

        <Button type="submit" className="w-full">
          Reportar pago
        </Button>
      </form>

      {/* Bloque 3: Mi historial */}
      <section className="space-y-2">
        <h2 className="font-semibold">Mi historial</h2>
        {sortedAportes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no has reportado pagos.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedAportes.map((a) => {
              const cfg = ESTADO_CONFIG[a.estado] ?? ESTADO_CONFIG.reportado;
              return (
                <li
                  key={a.id}
                  className="rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {info.enBolivares ? "Bs " : ""}
                      {fmt(a.monto)}
                      {!info.enBolivares ? ` ${info.ancla}` : ""}
                      {info.enBolivares && a.montoAncla != null && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          ≈ ${fmt(a.montoAncla)}
                        </span>
                      )}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  {a.referencia && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ref: {a.referencia}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Pagó el{" "}
                    {new Date(a.fechaPago ?? a.creadoEn).toLocaleDateString("es-VE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
