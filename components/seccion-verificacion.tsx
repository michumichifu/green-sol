import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { EstadoKyc } from "@prisma/client";
import type { PasosRequeridos } from "@/lib/kyc/config";
import { ItemKyc } from "@/components/kyc/item-kyc";

function ItemVerif({
  numero,
  hecho,
  titulo,
  sub,
  enlace,
  pronto,
}: {
  numero: number;
  hecho: boolean;
  titulo: string;
  sub: string;
  enlace?: string;
  pronto?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      {/* Número del paso (izquierda) */}
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          hecho ? "bg-brand/15 text-brand" : "bg-muted text-muted-foreground"
        }`}
      >
        {numero}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {/* Estado (derecha) */}
      {hecho ? (
        <CheckCircle2 className="size-5 shrink-0 text-brand" />
      ) : pronto ? (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Pronto
        </span>
      ) : enlace ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      ) : null}
    </div>
  );
  return enlace && !hecho && !pronto ? <Link href={enlace}>{inner}</Link> : inner;
}

export function SeccionVerificacion({
  correoVerificado,
  estadoKyc,
  motivoRechazoKyc,
  pasosKyc,
}: {
  correoVerificado: boolean;
  estadoKyc: EstadoKyc | null;
  motivoRechazoKyc: string | null;
  pasosKyc: PasosRequeridos;
}) {
  const kycHecho = estadoKyc === "aprobada";
  // El PIN ya se crea durante el registro, así que no es un paso pendiente aquí.
  // Los dos pasos de verificación son: correo (hecho al registrarse) e identidad (KYC).
  const hechos = [correoVerificado, kycHecho].filter(Boolean).length;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Verificación de la cuenta</h2>
        <p className="text-xs text-muted-foreground">
          Completa estos pasos para desbloquear todas las funciones.{" "}
          ({hechos}/2)
        </p>
      </div>
      <ItemVerif
        numero={1}
        hecho={correoVerificado}
        titulo="Correo verificado"
        sub="Confirmado al registrarte."
      />
      <ItemKyc
        numero={2}
        estado={estadoKyc}
        motivoRechazo={motivoRechazoKyc}
        pasos={pasosKyc}
      />
    </section>
  );
}
