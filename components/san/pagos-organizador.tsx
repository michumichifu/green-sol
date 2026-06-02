"use client";

import { PanelTabs } from "@/components/panel-tabs";
import { FilaParticipante } from "@/components/san/fila-participante";
import { DonaProgreso } from "@/components/san/dona-progreso";
import { Button } from "@/components/ui/button";
import { infoMontoParticipante, aportePersona } from "@/lib/san/montos";
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
  resolver: (aporteId: string, aprobar: boolean) => void;
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
}: PagosOrganizadorProps) {
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

  function etiquetaMonto(monto: number) {
    if (info.enBolivares) {
      const bsStr = `Bs ${fmt(monto)}`;
      if (info.tasa && info.tasa > 0) {
        return `${bsStr} ≈ $${fmt(monto / info.tasa)}`;
      }
      return bsStr;
    }
    return `${fmt(monto)} ${info.ancla}`;
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
        <div className="space-y-2 pt-1">
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No hay pagos por revisar.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendientes.map((a) => {
                const aprobar = resolver.bind(null, a.id, true);
                const rechazar = resolver.bind(null, a.id, false);
                return (
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
                        {etiquetaMonto(a.monto)}
                      </span>
                      <span>{fmtFecha(a.creadoEn)}</span>
                    </div>
                    {a.referencia && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Ref: {a.referencia}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <form action={aprobar} className="flex-1">
                        <Button
                          type="submit"
                          size="sm"
                          className="w-full"
                          variant="outline"
                        >
                          Aprobar
                        </Button>
                      </form>
                      <form action={rechazar} className="flex-1">
                        <Button
                          type="submit"
                          size="sm"
                          className="w-full"
                          variant="ghost"
                        >
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
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
                        {etiquetaMonto(a.monto)}
                      </span>
                      <span>{fmtFecha(a.creadoEn)}</span>
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
                            {etiquetaMonto(a.monto)}
                          </span>
                          <span>{fmtFecha(a.creadoEn)}</span>
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
    </div>
  );
}
