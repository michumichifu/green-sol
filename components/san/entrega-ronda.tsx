"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, HandCoins, Clock } from "lucide-react";
import { CampoPin } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DonaProgreso } from "@/components/san/dona-progreso";

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
  reportarEntrega: (referencia: string, pin: string) => Promise<{ error?: string }>;
  iniciarSiguiente: (pin: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "entregar" | "avanzar">(null);
  const [referencia, setReferencia] = useState("");
  const [pin, setPin] = useState("");
  const [proc, setProc] = useState(false);
  const [error, setError] = useState("");

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
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-3 text-xs text-muted-foreground">
                  Declaro que entregué el total de esta ronda a{" "}
                  <b className="text-foreground">{cobradorNombre}</b>.
                </div>
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
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={confirmar}
                disabled={proc || !/^\d{6}$/.test(pin)}
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
