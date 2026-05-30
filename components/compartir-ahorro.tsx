"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export function CompartirAhorro({
  codigo,
  nombre,
}: {
  codigo: string;
  nombre: string;
}) {
  const [copiado, setCopiado] = useState<"link" | "codigo" | null>(null);

  function enlace() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/sanes/unirse?codigo=${codigo}`;
  }

  async function copiar(tipo: "link" | "codigo", texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      // sin permisos de portapapeles
    }
  }

  async function compartir() {
    const url = enlace();
    if (navigator.share) {
      try {
        await navigator.share({
          title: nombre,
          text: `Únete a "${nombre}" en Green Sol`,
          url,
        });
        return;
      } catch {
        // canceló
      }
    }
    copiar("link", url);
  }

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Invitar / compartir</h2>
      <p className="text-xs text-muted-foreground">
        Comparte el enlace o el código para que se unan a este ahorro.
      </p>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {codigo}
        </span>
        <button
          type="button"
          onClick={() => copiar("codigo", codigo)}
          className="flex items-center gap-1 text-xs font-medium text-brand"
        >
          {copiado === "codigo" ? (
            <>
              <Check className="size-3.5" /> Copiado
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Código
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => copiar("link", enlace())}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium"
        >
          {copiado === "link" ? (
            <>
              <Check className="size-4" /> Enlace copiado
            </>
          ) : (
            <>
              <Copy className="size-4" /> Copiar enlace
            </>
          )}
        </button>
        <button
          type="button"
          onClick={compartir}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-sm font-medium text-white"
        >
          <Share2 className="size-4" /> Compartir
        </button>
      </div>
    </section>
  );
}
