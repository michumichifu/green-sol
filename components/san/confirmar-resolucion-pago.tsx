"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoPin } from "@/components/campo-pin";

/**
 * Pop-up de confirmación al aprobar/rechazar un pago. Al aprobar, el organizador
 * hace una declaración de que recibió los fondos; en ambos casos confirma con PIN.
 */
export function ConfirmarResolucionPago({
  aprobar,
  nombre,
  usuario,
  montoTxt,
  referencia,
  onConfirmar,
  onCerrar,
}: {
  aprobar: boolean;
  nombre: string;
  usuario: string | null;
  montoTxt: string;
  referencia: string | null;
  onConfirmar: (pin: string) => Promise<{ error?: string }>;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [proc, setProc] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function confirmar() {
    setProc(true);
    setError("");
    const res = await onConfirmar(pin);
    setProc(false);
    if (res?.error) setError(res.error);
    else {
      onCerrar();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onCerrar();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border bg-card p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            {aprobar ? (
              <ShieldCheck className="size-5 text-brand" />
            ) : (
              <AlertTriangle className="size-5 text-destructive" />
            )}
            {aprobar ? "Confirmar pago recibido" : "Rechazar pago"}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Datos del pago */}
        <div className="space-y-1 rounded-xl border bg-muted/40 p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Participante: </span>
            <b>{nombre}</b>
            {usuario && <span className="text-muted-foreground"> @{usuario}</span>}
          </p>
          <p>
            <span className="text-muted-foreground">Monto: </span>
            <b>{montoTxt}</b>
          </p>
          {referencia && (
            <p>
              <span className="text-muted-foreground">Referencia: </span>
              {referencia}
            </p>
          )}
        </div>

        {/* Declaración / aviso */}
        {aprobar ? (
          <div className="flex gap-2 rounded-xl border border-brand/30 bg-brand/5 p-3 text-xs">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              Declaro que verifiqué mi cuenta y <b>confirmo que recibí estos fondos</b> de{" "}
              {nombre}. Esta confirmación queda bajo mi responsabilidad como organizador.
            </span>
          </div>
        ) : (
          <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <span>
              Vas a marcar este pago como <b>no recibido</b>. Se le notificará al
              participante.
            </span>
          </div>
        )}

        {/* PIN */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Confirma con tu PIN</p>
          <CampoPin onChange={setPin} testId="resolver-pin" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="button"
          className="w-full"
          variant={aprobar ? "default" : "destructive"}
          onClick={confirmar}
          disabled={proc || !/^\d{6}$/.test(pin)}
        >
          {proc
            ? "Procesando..."
            : aprobar
              ? "Confirmo que recibí el pago"
              : "Rechazar pago"}
        </Button>
      </div>
    </div>
  );
}
