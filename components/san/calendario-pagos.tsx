"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";

export type Vencimiento = {
  fecha: string; // YYYY-MM-DD
  sanId: string;
  sanNombre: string;
  ronda: number;
  cuotaTxt: string; // ej. "Bs 11.600 ≈ $20" o "$20"
  estado: "pendiente" | "en_revision" | "pagado";
};

const ESTADO_BADGE: Record<
  Vencimiento["estado"],
  { txt: string; cls: string }
> = {
  pendiente: { txt: "Por pagar", cls: "bg-gold/20 text-gold" },
  en_revision: {
    txt: "En revisión",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  pagado: {
    txt: "Pagado",
    cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
};

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Calendario de "Cuentas por pagar": una tira lineal de días (hoy resaltado, días
 * con cuota marcados en amarillo). Al tocar un día se ven los sanes que vencen y
 * cuánto. Botón para desplegar la vista de mes completa.
 */
export function CalendarioPagos({ vencimientos }: { vencimientos: Vencimiento[] }) {
  const [hoy, setHoy] = useState("");
  const [sel, setSel] = useState("");
  const [verMes, setVerMes] = useState(false);

  useEffect(() => {
    const h = ymd(new Date());
    setHoy(h);
    setSel(h);
  }, []);

  const porDia = useMemo(() => {
    const m: Record<string, Vencimiento[]> = {};
    for (const v of vencimientos) (m[v.fecha] ??= []).push(v);
    return m;
  }, [vencimientos]);

  // Tira de 14 días, empezando 2 días antes de hoy.
  const tira = useMemo(() => {
    if (!hoy) return [];
    const base = new Date(`${hoy}T12:00:00`);
    base.setDate(base.getDate() - 2);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [hoy]);

  // Días del mes de la fecha seleccionada (para la vista mensual).
  const mes = useMemo(() => {
    if (!sel) return [];
    const ref = new Date(`${sel}T12:00:00`);
    const primero = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const dias: (Date | null)[] = [];
    for (let i = 0; i < primero.getDay(); i++) dias.push(null); // huecos previos
    const ultimo = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= ultimo; d++)
      dias.push(new Date(ref.getFullYear(), ref.getMonth(), d));
    return dias;
  }, [sel]);

  const delDia = porDia[sel] ?? [];

  if (!hoy) return null;

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-brand" />
          <h2 className="text-sm font-semibold">Calendario</h2>
        </div>
        <button
          type="button"
          onClick={() => setVerMes((v) => !v)}
          className="text-xs font-medium text-brand"
        >
          {verMes ? "Ver semana" : "Ver mes"}
        </button>
      </div>

      {verMes ? (
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">{d}</span>
          ))}
          {mes.map((d, i) => {
            if (!d) return <span key={i} />;
            const k = ymd(d);
            const tiene = !!porDia[k];
            const esHoy = k === hoy;
            const esSel = k === sel;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSel(k)}
                className={`relative mx-auto flex size-9 flex-col items-center justify-center rounded-lg text-sm ${
                  esSel ? "bg-brand text-white" : esHoy ? "bg-brand/10 text-brand" : "hover:bg-muted"
                }`}
              >
                {d.getDate()}
                {tiene && (
                  <span
                    className={`absolute bottom-1 size-1.5 rounded-full ${esSel ? "bg-white" : "bg-gold"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {tira.map((d) => {
            const k = ymd(d);
            const tiene = !!porDia[k];
            const esHoy = k === hoy;
            const esSel = k === sel;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSel(k)}
                className={`relative flex w-11 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-1 py-2 ${
                  esSel
                    ? "border-brand bg-brand text-white"
                    : esHoy
                      ? "border-brand/40 bg-brand/5"
                      : "border-transparent"
                }`}
              >
                <span className="text-[10px] opacity-80">{DIAS_SEMANA[d.getDay()]}</span>
                <span className="text-base font-bold leading-none">{d.getDate()}</span>
                <span className="text-[9px] opacity-70">{MESES[d.getMonth()]}</span>
                {tiene && (
                  <span
                    className={`absolute right-1 top-1 size-2 rounded-full ${esSel ? "bg-white" : "bg-gold"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Vencimientos del día seleccionado */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          {sel === hoy ? "Hoy" : "Ese día"}
          {sel ? ` · ${new Date(`${sel}T12:00:00`).toLocaleDateString("es-VE", { day: "2-digit", month: "long" })}` : ""}
        </p>
        {delDia.length === 0 ? (
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Sin cuentas por pagar este día.
          </p>
        ) : (
          delDia.map((v) => (
            <Link
              key={`${v.sanId}-${v.ronda}`}
              href={`/sanes/${v.sanId}?tab=pagos`}
              className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 hover:bg-muted/40"
            >
              <span className="size-2 shrink-0 rounded-full bg-gold" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{v.sanNombre}</span>
                <span className="block text-xs text-muted-foreground">
                  Ronda {v.ronda} · {v.cuotaTxt}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${ESTADO_BADGE[v.estado].cls}`}
              >
                {ESTADO_BADGE[v.estado].txt}
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
