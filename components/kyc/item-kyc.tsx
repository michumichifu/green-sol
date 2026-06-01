"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, ShieldX, ChevronRight } from "lucide-react";
import type { EstadoKyc } from "@prisma/client";
import type { PasosRequeridos } from "@/lib/kyc/config";
import { AsistenteKyc } from "@/components/kyc/asistente-kyc";

export function ItemKyc({
  numero,
  estado,
  motivoRechazo,
  pasos,
}: {
  numero: number;
  estado: EstadoKyc | null;
  motivoRechazo: string | null;
  pasos: PasosRequeridos;
}) {
  const [abierto, setAbierto] = useState(false);

  const aprobada = estado === "aprobada";
  const enCurso = estado === "pendiente" || estado === "en_revision";
  const baneada = estado === "baneada";
  // Puede iniciar/reintentar si no hay nada en curso ni aprobado ni baneado.
  const puedeIniciar = !aprobada && !enCurso && !baneada;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            aprobada ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
          }`}
        >
          {numero}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Verificación de identidad (KYC)</p>
          <p className="text-xs text-muted-foreground">
            {aprobada
              ? "Tu identidad está verificada."
              : enCurso
                ? "Estamos revisando tu identidad."
                : baneada
                  ? "Cuenta suspendida. Contacta a soporte."
                  : estado === "reenvio_solicitado"
                    ? "Necesita correcciones. Vuelve a enviar."
                    : estado === "rechazada"
                      ? "No fue aprobada. Puedes intentar de nuevo."
                      : "Documento + selfie + video para subir tus límites."}
          </p>
        </div>
        {aprobada ? (
          <CheckCircle2 className="size-5 shrink-0 text-brand" />
        ) : enCurso ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
            <Clock className="size-3" /> En revisión
          </span>
        ) : baneada ? (
          <ShieldX className="size-5 shrink-0 text-destructive" />
        ) : puedeIniciar ? (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
          >
            {estado === "reenvio_solicitado" || estado === "rechazada" ? "Reenviar" : "Iniciar"}
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Motivo cuando piden corrección o se rechazó */}
      {(estado === "reenvio_solicitado" || estado === "rechazada") && motivoRechazo && (
        <div className="flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/5 p-2.5 text-xs">
          <AlertCircle className="size-4 shrink-0 text-gold" />
          <span>{motivoRechazo}</span>
        </div>
      )}

      {abierto && puedeIniciar && <AsistenteKyc pasos={pasos} />}
    </div>
  );
}
