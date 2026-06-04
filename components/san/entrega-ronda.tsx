"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, HandCoins, Clock } from "lucide-react";
import { CampoPin } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonaProgreso } from "@/components/san/dona-progreso";
import { BANCOS_VE } from "@/lib/bancos-venezuela";

type CobradorPago = {
  metodo: string;
  banco: string | null;
  telefono: string | null;
  titular: string | null;
  cedula: string | null;
  numeroCuenta: string | null;
  tipoCuenta: string | null;
  wallet: string | null;
  email: string | null;
} | null;

function fmt(n: number) {
  return n.toLocaleString("es-VE", { maximumFractionDigits: 2 });
}

/**
 * Vista del organizador para cerrar una ronda: progreso de pagos de la ronda,
 * entregar el bote al cobrador (con referencia + PIN) y avanzar a la siguiente
 * ronda (o finalizar el san). Solo para el organizador, con el san en curso.
 */
export function EntregaRonda({
  rondaActual,
  totalRondas,
  pagadosRonda,
  aportantes,
  completa,
  entregada,
  cobradorNombre,
  boteAncla,
  boteBs,
  ancla,
  fuenteTasa,
  cobradorPago,
  reportarEntrega,
  iniciarSiguiente,
}: {
  rondaActual: number;
  totalRondas: number;
  pagadosRonda: number;
  aportantes: number;
  completa: boolean;
  entregada: boolean;
  cobradorNombre: string;
  boteAncla: number;
  boteBs: number | null;
  ancla: string;
  fuenteTasa: string | null;
  cobradorPago: CobradorPago;
  reportarEntrega: (referencia: string, pin: string) => Promise<{ error?: string }>;
  iniciarSiguiente: (pin: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "entregar" | "avanzar">(null);
  const [referencia, setReferencia] = useState("");
  const [pin, setPin] = useState("");
  const [proc, setProc] = useState(false);
  const [error, setError] = useState("");
  const [acepta, setAcepta] = useState(false);

  const bancoCobrador = cobradorPago?.banco
    ? BANCOS_VE.find((b) => b.codigo === cobradorPago.banco)?.nombre ??
      cobradorPago.banco
    : null;

  useEffect(() => {
    if (!modal) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);

  const esUltima = rondaActual >= totalRondas;

  async function confirmar() {
    setProc(true);
    setError("");
    const res =
      modal === "entregar"
        ? await reportarEntrega(referencia, pin)
        : await iniciarSiguiente(pin);
    setProc(false);
    if (res?.error) setError(res.error);
    else {
      setModal(null);
      setReferencia("");
      setPin("");
      setAcepta(false);
      router.refresh();
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <DonaProgreso pagados={pagadosRonda} total={aportantes} label="esta ronda" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Ronda {rondaActual} de {totalRondas}
          </p>
          <p className="text-xs text-muted-foreground">
            {pagadosRonda} de {aportantes} pagaron esta ronda
          </p>
          <p className="text-xs text-muted-foreground">
            Cobra: <span className="font-medium text-foreground">{cobradorNombre}</span>
          </p>
        </div>
      </div>

      {entregada ? (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-brand">
            <PartyPopper className="size-4" /> Entregado a {cobradorNombre}.
          </p>
          <Button type="button" className="w-full" onClick={() => setModal("avanzar")}>
            {esUltima ? "Finalizar el san" : `Iniciar la ronda ${rondaActual + 1}`}
          </Button>
        </div>
      ) : completa ? (
        <div className="space-y-2 rounded-xl border border-brand/30 bg-brand/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <HandCoins className="size-4 text-brand" /> Te toca entregar el bote a{" "}
            {cobradorNombre}.
          </p>
          <p className="text-xs text-muted-foreground">
            Transfiérele el total recogido y registra la entrega.
          </p>
          <Button type="button" className="w-full" onClick={() => setModal("entregar")}>
            Reportar entrega
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <Clock className="size-4 shrink-0" /> Faltan pagos por confirmar para cerrar esta
          ronda. Cuando todos paguen, podrás entregar el bote a {cobradorNombre}.
        </p>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setModal(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md space-y-3 rounded-3xl border bg-card p-5 shadow-2xl"
          >
            <h2 className="text-base font-semibold">
              {modal === "entregar"
                ? `Entregar el bote a ${cobradorNombre}`
                : esUltima
                  ? "Finalizar el san"
                  : `Iniciar la ronda ${rondaActual + 1}`}
            </h2>

            {modal === "entregar" ? (
              <>
                {/* Cuánto entregar */}
                <div className="rounded-xl border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Le corresponde el bote</p>
                  <p className="text-lg font-bold">
                    {ancla} {fmt(boteAncla)}
                    {boteBs != null && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        ≈ Bs {fmt(boteBs)}
                        {fuenteTasa ? ` · ${fuenteTasa}` : ""}
                      </span>
                    )}
                  </p>
                </div>

                {/* Datos de pago del cobrador */}
                <div className="rounded-xl border bg-card p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Págale a {cobradorNombre}:
                  </p>
                  {cobradorPago ? (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                      {cobradorPago.wallet ? (
                        <>
                          <dt className="text-muted-foreground">Wallet</dt>
                          <dd className="break-all font-medium">{cobradorPago.wallet}</dd>
                        </>
                      ) : (
                        <>
                          {bancoCobrador && (
                            <>
                              <dt className="text-muted-foreground">Banco</dt>
                              <dd className="font-medium">{bancoCobrador}</dd>
                            </>
                          )}
                          {cobradorPago.telefono && (
                            <>
                              <dt className="text-muted-foreground">Teléfono</dt>
                              <dd className="font-medium">{cobradorPago.telefono}</dd>
                            </>
                          )}
                          {cobradorPago.numeroCuenta && (
                            <>
                              <dt className="text-muted-foreground">Cuenta</dt>
                              <dd className="font-medium">{cobradorPago.numeroCuenta}</dd>
                            </>
                          )}
                          {cobradorPago.titular && (
                            <>
                              <dt className="text-muted-foreground">Titular</dt>
                              <dd className="font-medium">{cobradorPago.titular}</dd>
                            </>
                          )}
                          {cobradorPago.cedula && (
                            <>
                              <dt className="text-muted-foreground">Cédula</dt>
                              <dd className="font-medium">{cobradorPago.cedula}</dd>
                            </>
                          )}
                        </>
                      )}
                    </dl>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {cobradorNombre} aún no registró datos de pago. Pídeselos
                      directamente antes de entregar.
                    </p>
                  )}
                </div>

                {/* Declaración con check (incluye los datos a los que se paga) */}
                <label className="flex cursor-pointer gap-2 rounded-xl border border-brand/30 bg-brand/5 p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={acepta}
                    onChange={(e) => setAcepta(e.target.checked)}
                    className="mt-0.5 shrink-0"
                  />
                  <span>
                    Declaro y confirmo que transferí{" "}
                    <b className="text-foreground">
                      {ancla} {fmt(boteAncla)}
                      {boteBs != null ? ` (Bs ${fmt(boteBs)})` : ""}
                    </b>{" "}
                    a <b className="text-foreground">{cobradorNombre}</b>
                    {cobradorPago?.cedula ? `, C.I. ${cobradorPago.cedula}` : ""}
                    {cobradorPago?.telefono ? `, tel. ${cobradorPago.telefono}` : ""}
                    {cobradorPago?.numeroCuenta ? `, cuenta ${cobradorPago.numeroCuenta}` : ""}
                    , y que esos datos le pertenecen a esa persona (no a un tercero).
                  </span>
                </label>

                <div className="space-y-1">
                  <label htmlFor="ref-entrega" className="text-xs font-medium">
                    Referencia de la entrega (opcional)
                  </label>
                  <Input
                    id="ref-entrega"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Ej: 00123456"
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {esUltima
                  ? "Todos cobraron su turno. El san quedará finalizado."
                  : "Arranca la recolección de la siguiente ronda; se avisa a todos."}
              </p>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-medium">Confirma con tu PIN</p>
              <CampoPin onChange={setPin} testId="entrega-pin" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setModal(null);
                  setError("");
                  setAcepta(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={confirmar}
                disabled={
                  proc ||
                  !/^\d{6}$/.test(pin) ||
                  (modal === "entregar" && !acepta)
                }
              >
                {proc ? "Procesando…" : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
