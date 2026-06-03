"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type InvitacionVista = { id: string; codigo: string; expiraEn: string };

const OPCIONES_DIAS = [1, 7, 30];

/** Genera, muestra y revoca invitaciones temporales con código corto y enlace. */
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

  async function generarInv() {
    setGenerando(true);
    setError("");
    const res = await generar(dias);
    setGenerando(false);
    if (res.error) setError(res.error);
    else router.refresh();
  }

  function enlaceAbsoluto(codigo: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/i/${codigo}`;
  }

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(enlaceAbsoluto(codigo));
      setCopiado(codigo);
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
            Genera un enlace temporal. Quien lo abra debe solicitar unirse.
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
        <ul className="space-y-2">
          {invitaciones.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold">GS-{inv.codigo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Vence el {new Date(inv.expiraEn).toLocaleDateString("es-VE")}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copiar(inv.codigo)}
              >
                {copiado === inv.codigo ? (
                  <Check className="size-4 text-brand" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await revocar(inv.id);
                  router.refresh();
                }}
                aria-label="Revocar"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
