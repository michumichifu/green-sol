"use client";

import { useState } from "react";
import { Landmark, Wallet, Eye, EyeOff, ChevronDown } from "lucide-react";
import { MONEDA_RECOLECTA } from "@/lib/validations/recolecta";
import { bancoLabel } from "@/lib/bancos-venezuela";
import { DatoCopiable } from "@/components/dato-copiable";

type DatosPago = {
  tipo: string;
  wallet?: string | null;
  banco?: string | null;
  tipoCuenta?: string | null;
  numeroCuenta?: string | null;
  telefono?: string | null;
  titular?: string | null;
  cedula?: string | null;
} | null;

/**
 * Tarjeta con los datos de pago del san (a dónde transfiere el participante).
 * Colapsable: por defecto muestra solo "¿Dónde pagar?" + el método; se despliega
 * al tocar para no tapar el resto (lo que toca pagar, el historial, las donas).
 */
export function MetodoPagoTarjeta({
  datosPago,
  moneda,
}: {
  datosPago: DatosPago;
  moneda: string;
}) {
  const [abierto, setAbierto] = useState(false);
  if (!datosPago) return null;
  const info = MONEDA_RECOLECTA[moneda];
  const esWallet = datosPago.tipo === "wallet";

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 p-4 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {esWallet ? <Wallet className="size-5" /> : <Landmark className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">¿Dónde pagar?</h2>
          <p className="text-xs text-muted-foreground">
            {esWallet
              ? `Wallet ${info?.simbolo ?? ""}`
              : datosPago.tipo === "transferencia"
                ? "Transferencia"
                : "Pago móvil"}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
          {abierto ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          <ChevronDown
            className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {abierto && (
        <div className="space-y-3 px-4 pb-4">
          {esWallet ? (
            <DatoCopiable etiqueta="Wallet" valor={datosPago.wallet ?? ""} />
          ) : (
            <div className="space-y-1.5">
              {/* El banco no se copia (se elige en la app del banco): código + nombre */}
              {datosPago.banco && (
                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                  <p className="text-[11px] text-muted-foreground">Banco</p>
                  <p className="text-sm font-medium">{bancoLabel(datosPago.banco)}</p>
                </div>
              )}
              {datosPago.telefono && (
                <DatoCopiable etiqueta="Teléfono" valor={datosPago.telefono} />
              )}
              {datosPago.numeroCuenta && (
                <DatoCopiable etiqueta="N° de cuenta" valor={datosPago.numeroCuenta} />
              )}
              {datosPago.cedula && (
                <DatoCopiable etiqueta="Cédula" valor={datosPago.cedula} />
              )}
              {datosPago.titular && (
                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                  <p className="text-[11px] text-muted-foreground">Titular</p>
                  <p className="text-sm font-medium">{datosPago.titular}</p>
                </div>
              )}
            </div>
          )}

          {info?.enBolivares && (
            <p className="text-xs text-muted-foreground">
              Paga el equivalente en Bs a la tasa del día.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
