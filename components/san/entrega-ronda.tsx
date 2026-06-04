"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, HandCoins, Clock } from "lucide-react";
import { CampoPin } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonaProgreso } from "@/components/san/dona-progreso";
import { bancoLabel } from "@/lib/bancos-venezuela";
import { DatoCopiable } from "@/components/dato-copiable";

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

  const bancoCobrador = cobradorPago?.banco ? bancoLabel(cobradorPago.banco) : null;

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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border p-3 text-center">
          <DonaProgreso pagados={rondaActual} total={totalRondas} label="ronda" />
          <p className="text-sm font-semibold">
            Ronda {rondaActual} de {totalRondas}
          </p>
          <p className="text-xs text-muted-foreground">
            Cobra <span className="font-medium text-foreground">{cobradorNombre}</span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-brand/30 bg-gradient-to-br from-brand/20 to-brand/5 p-3 text-center">
          <DonaProgreso
            pagados={pagadosRonda}
            total={aportantes}
            label="pagos"
            colorBase="#ffffff"
            gradiente={{ id: "dona-pagos", desde: "#fef9c3", hasta: "#fde047" }}
          />
          <p className="text-sm font-semibold">
            {pagadosRonda} de {aportantes} pagaron
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
                    cobradorPago.wallet ? (
                      <DatoCopiable etiqueta="Wallet" valor={cobradorPago.wallet} />
                    ) : (
                      <div className="space-y-1.5">
                        {bancoCobrador && (
                          <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                            <p className="text-[11px] text-muted-foreground">Banco</p>
                            <p className="text-sm font-medium">{bancoCobrador}</p>
                          </div>
                        )}
                        {cobradorPago.telefono && (
                          <DatoCopiable etiqueta="Teléfono" valor={cobradorPago.telefono} />
                        )}
                        {cobradorPago.numeroCuenta && (
                          <DatoCopiable
                            etiqueta="N° de cuenta"
                            valor={cobradorPago.numeroCuenta}
                          />
                        )}
                        {cobradorPago.cedula && (
                          <DatoCopiable etiqueta="Cédula" valor={cobradorPago.cedula} />
                        )}
                        {cobradorPago.titular && (
                          <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
                            <p className="text-[11px] text-muted-foreground">Titular</p>
                            <p className="text-sm font-medium">{cobradorPago.titular}</p>
                          </div>
                        )}
                      </div>
                    )
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
                    Confirmo que pagué{" "}
                    <b className="text-foreground">
                      {ancla} {fmt(boteAncla)}
                      {boteBs != null ? ` (Bs ${fmt(boteBs)})` : ""}
                    </b>{" "}
                    a <b className="text-foreground">{cobradorNombre}</b>
                    {cobradorPago?.cedula ? `, C.I. ${cobradorPago.cedula}` : ""}
                    {cobradorPago?.telefono ? `, tel. ${cobradorPago.telefono}` : ""}, y que
                    esos datos son de esa persona.
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
