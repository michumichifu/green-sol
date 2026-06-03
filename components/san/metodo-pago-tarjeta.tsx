import { Landmark, Wallet } from "lucide-react";
import { MONEDA_RECOLECTA } from "@/lib/validations/recolecta";
import { BANCOS_VE } from "@/lib/bancos-venezuela";

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
  const banco =
    BANCOS_VE.find((b) => b.codigo === datosPago.banco)?.nombre ?? datosPago.banco;

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
        <p className="break-all rounded-lg bg-muted px-3 py-2 text-sm font-medium">
          {datosPago.wallet}
        </p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Banco</dt>
          <dd className="font-medium">{banco}</dd>
          {datosPago.tipoCuenta && (
            <>
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-medium capitalize">{datosPago.tipoCuenta}</dd>
            </>
          )}
          {datosPago.numeroCuenta && (
            <>
              <dt className="text-muted-foreground">N° cuenta</dt>
              <dd className="font-medium">{datosPago.numeroCuenta}</dd>
            </>
          )}
          {datosPago.telefono && (
            <>
              <dt className="text-muted-foreground">Teléfono</dt>
              <dd className="font-medium">{datosPago.telefono}</dd>
            </>
          )}
          {datosPago.titular && (
            <>
              <dt className="text-muted-foreground">Titular</dt>
              <dd className="font-medium">{datosPago.titular}</dd>
            </>
          )}
          {datosPago.cedula && (
            <>
              <dt className="text-muted-foreground">Cédula</dt>
              <dd className="font-medium">{datosPago.cedula}</dd>
            </>
          )}
        </dl>
      )}

      {info?.enBolivares && (
        <p className="text-xs text-muted-foreground">
          Paga el equivalente en Bs a la tasa del día.
        </p>
      )}
    </section>
  );
}
