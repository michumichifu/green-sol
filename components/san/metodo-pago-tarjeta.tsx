import { Landmark, Wallet } from "lucide-react";
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

/** Tarjeta visual con los datos de pago del san (a dónde transfiere el participante). */
export function MetodoPagoTarjeta({
  datosPago,
  moneda,
}: {
  datosPago: DatosPago;
  moneda: string;
}) {
  if (!datosPago) return null;
  const info = MONEDA_RECOLECTA[moneda];
  const esWallet = datosPago.tipo === "wallet";

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {esWallet ? <Wallet className="size-5" /> : <Landmark className="size-5" />}
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">¿Dónde pagar?</h2>
          <p className="text-xs text-muted-foreground">
            {esWallet
              ? `Wallet ${info?.simbolo ?? ""}`
              : datosPago.tipo === "transferencia"
                ? "Transferencia"
                : "Pago móvil"}
          </p>
        </div>
      </div>

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
    </section>
  );
}
