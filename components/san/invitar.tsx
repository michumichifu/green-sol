"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InvitacionVista = { id: string; codigo: string; expiraEn: string };

const OPCIONES_DIAS = [1, 7, 30];

/** Genera, muestra y revoca invitaciones temporales: código corto + enlace directo. */
export function Invitar({
  invitaciones,
  generar,
  revocar,
}: {
  invitaciones: InvitacionVista[];
  generar: (dias: number) => Promise<{ codigo?: string; enlace?: string; error?: string }>;
  revocar: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const [dias, setDias] = useState(7);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  async function generarInv() {
    setGenerando(true);
    setError("");
    const res = await generar(dias);
    setGenerando(false);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  async function copiar(texto: string, marca: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(marca);
      setTimeout(() => setCopiado(""), 1500);
    } catch {
      // sin portapapeles: el usuario puede copiar a mano
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Ticket className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-tight">Invitar al san</h2>
          <p className="text-xs text-muted-foreground">
            Comparte el código o el enlace. Quien lo abra te enviará una solicitud para
            unirse, que tú apruebas.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-muted p-1">
          {OPCIONES_DIAS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDias(d)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                dias === d ? "bg-card shadow-sm" : "text-muted-foreground"
              }`}
            >
              {d} {d === 1 ? "día" : "días"}
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={generarInv}
          disabled={generando}
        >
          {generando ? "Generando..." : "Generar invitación"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {invitaciones.length > 0 && (
        <ul className="space-y-3">
          {invitaciones.map((inv) => {
            const enlace = origin ? `${origin}/i/${inv.codigo}` : `/i/${inv.codigo}`;
            return (
              <li key={inv.id} className="space-y-2 rounded-lg border p-3">
                {/* Código de invitación */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Código de invitación
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-mono text-sm font-semibold">
                      GS-{inv.codigo}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copiar(`GS-${inv.codigo}`, `${inv.id}-cod`)}
                    >
                      {copiado === `${inv.id}-cod` ? (
                        <Check className="size-4 text-brand" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Cópialo y compártelo; con él pueden buscar el san y solicitar unirse.
                  </p>
                </div>

                {/* Enlace directo */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Enlace directo</p>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate font-mono text-xs">{enlace}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => copiar(enlace, `${inv.id}-link`)}
                    >
                      {copiado === `${inv.id}-link` ? (
                        <Check className="size-4 text-brand" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Compártelo por WhatsApp; lleva directo a solicitar unirse.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Vence el {new Date(inv.expiraEn).toLocaleDateString("es-VE")}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-muted-foreground"
                    onClick={async () => {
                      await revocar(inv.id);
                      router.refresh();
                    }}
                  >
                    <X className="size-4" /> Revocar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
