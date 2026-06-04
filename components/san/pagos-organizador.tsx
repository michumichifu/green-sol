"use client";

import { useState } from "react";
import { PanelTabs } from "@/components/panel-tabs";
import { FilaParticipante } from "@/components/san/fila-participante";
import { DonaProgreso } from "@/components/san/dona-progreso";
import { ConfirmarResolucionPago } from "@/components/san/confirmar-resolucion-pago";
import { Button } from "@/components/ui/button";
import { infoMontoParticipante, aportePersona } from "@/lib/san/montos";
import {
  fechaCorte,
  puntualidad,
  montoMora,
  PUNTUALIDAD_LABEL,
  type Puntualidad,
} from "@/lib/san/rondas";
import type { Tasas } from "@/lib/rates/cache";

type UsuarioBasico = {
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  fotoUrl: string | null;
  correo: string;
};

type Participante = {
  usuario: UsuarioBasico;
};

type Aporte = {
  id: string;
  monto: number;
  montoAncla: number | null;
  ronda: number;
  fechaPago: Date | null;
  referencia: string | null;
  estado: "reportado" | "confirmado" | "rechazado";
  creadoEn: Date;
  participante: Participante;
};

type Recolecta = {
  moneda: string;
  montoAporte: number | null;
  cupoMiembros: number | null;
};

interface PagosOrganizadorProps {
  recolecta: Recolecta;
  tasas: Tasas;
  aportes: Aporte[];
  resolver: (
    aporteId: string,
    aprobar: boolean,
    pin: string,
  ) => Promise<{ error?: string }>;
  fechaInicio: Date | null;
  diasFrecuencia: number;
  moraTipo: string;
  moraValor: number | null;
}

const PUNT_CLASE: Record<Puntualidad, string> = {
  a_tiempo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  adelantado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  mora: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function nombreCompleto(u: UsuarioBasico) {
  return [u.nombre, u.apellido].filter(Boolean).join(" ") || u.correo;
}

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

function fmtFecha(d: Date) {
  return new Date(d).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PagosOrganizador({
  recolecta,
  tasas,
  aportes,
  resolver,
  fechaInicio,
  diasFrecuencia,
  moraTipo,
  moraValor,
}: PagosOrganizadorProps) {
  const [confirmando, setConfirmando] = useState<{
    aporte: Aporte;
    aprobar: boolean;
  } | null>(null);

  const pendientes = aportes.filter((a) => a.estado === "reportado");
  const aprobados = aportes.filter((a) => a.estado === "confirmado");
  const rechazados = aportes.filter((a) => a.estado === "rechazado");

  const totalParticipantes = recolecta.cupoMiembros ?? 0;
  const totalConfirmados = aprobados.length;

  const info = infoMontoParticipante(
    recolecta.moneda,
    aportePersona(recolecta.montoAporte ?? 0, recolecta.cupoMiembros),
    tasas,
  );

  // Usa el equivalente en $ congelado al reportar (no recalcula con la tasa de hoy).
  function etiquetaMonto(a: { monto: number; montoAncla: number | null }) {
    if (info.enBolivares) {
      const bsStr = `Bs ${fmt(a.monto)}`;
      const usd =
        a.montoAncla ?? (info.tasa && info.tasa > 0 ? a.monto / info.tasa : null);
      return usd != null ? `${bsStr} ≈ $${fmt(usd)}` : bsStr;
    }
    return `${fmt(a.montoAncla ?? a.monto)} ${info.ancla}`;
  }

  function fmtFechaPago(a: { fechaPago: Date | null; creadoEn: Date }) {
    return fmtFecha(a.fechaPago ?? a.creadoEn);
  }

  // Badge de puntualidad (a tiempo / adelantado / con atraso) + mora si aplica.
  function badgePunt(a: Aporte) {
    if (!fechaInicio) return null;
    const corte = fechaCorte(fechaInicio, a.ronda, diasFrecuencia);
    const p = puntualidad(a.fechaPago ?? a.creadoEn, corte);
    const mora = p === "mora" ? montoMora(moraTipo, moraValor, info.montoAncla) : 0;
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PUNT_CLASE[p]}`}>
        {PUNTUALIDAD_LABEL[p]}
        {mora > 0 ? ` · +${fmt(mora)} ${info.ancla}` : ""}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mini-resumen */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <DonaProgreso
          pagados={totalConfirmados}
          total={totalParticipantes > 0 ? totalParticipantes : aportes.length || 1}
          label="pagos"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {totalConfirmados} de{" "}
            {totalParticipantes > 0 ? totalParticipantes : "?"} pagaron
          </p>
          {pendientes.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {pendientes.length} por revisar
            </p>
          )}
          {rechazados.length > 0 && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {rechazados.length} rechazado{rechazados.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Sub-pestañas */}
      <PanelTabs variante="sub" tabs={["Pendientes", "Aprobados"]}>
        {/* Pendientes */}
        <div className="pt-1">
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay pagos por revisar.
            </p>
          ) : (
            <div className="rounded-xl bg-gradient-to-b from-amber-100 to-transparent p-3 dark:from-amber-950/30">
              <ul className="space-y-2">
              {pendientes.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border bg-card px-3 py-2 text-sm"
                >
                  <FilaParticipante
                    usuario={a.participante.usuario}
                    esOrganizador={false}
                  />
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {etiquetaMonto(a)}
                    </span>
                    <span className="flex items-center gap-2">{badgePunt(a)}{fmtFechaPago(a)}</span>
                  </div>
                  {a.referencia && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ref: {a.referencia}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      variant="outline"
                      onClick={() => setConfirmando({ aporte: a, aprobar: true })}
                    >
                      Aprobar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      variant="ghost"
                      onClick={() => setConfirmando({ aporte: a, aprobar: false })}
                    >
                      Rechazar
                    </Button>
                  </div>
                </li>
              ))}
              </ul>
            </div>
          )}
        </div>

        {/* Aprobados */}
        <div className="space-y-2 pt-1">
          {aprobados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aún no hay pagos aprobados.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {aprobados.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <FilaParticipante
                      usuario={a.participante.usuario}
                      esOrganizador={false}
                      cobrado
                    />
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {etiquetaMonto(a)}
                      </span>
                      <span className="flex items-center gap-2">{badgePunt(a)}{fmtFechaPago(a)}</span>
                    </div>
                    {a.referencia && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Ref: {a.referencia}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {rechazados.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    {rechazados.length} pago{rechazados.length !== 1 ? "s" : ""} rechazado{rechazados.length !== 1 ? "s" : ""}
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {rechazados.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/30 dark:bg-red-950/20"
                      >
                        <FilaParticipante
                          usuario={a.participante.usuario}
                          esOrganizador={false}
                        />
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-red-600 dark:text-red-400">
                            {etiquetaMonto(a)}
                          </span>
                          <span className="flex items-center gap-2">{badgePunt(a)}{fmtFechaPago(a)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      </PanelTabs>

      {confirmando && (
        <ConfirmarResolucionPago
          aprobar={confirmando.aprobar}
          nombre={nombreCompleto(confirmando.aporte.participante.usuario)}
          usuario={confirmando.aporte.participante.usuario.nombreUsuario}
          montoTxt={etiquetaMonto(confirmando.aporte)}
          referencia={confirmando.aporte.referencia}
          onConfirmar={(pin) =>
            resolver(confirmando.aporte.id, confirmando.aprobar, pin)
          }
          onCerrar={() => setConfirmando(null)}
        />
      )}
    </div>
  );
}
