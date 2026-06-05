"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * Muestra una etiqueta + valor con un botón para copiar al portapapeles.
 * `display` opcional permite mostrar un texto distinto (p. ej. una dirección
 * truncada) mientras se copia el `valor` completo.
 */
export function DatoCopiable({
  etiqueta,
  valor,
  display,
}: {
  etiqueta: string;
  valor: string;
  display?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // sin portapapeles: el usuario copia a mano
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{etiqueta}</p>
        <p className="truncate text-sm font-medium">{display ?? valor}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={`Copiar ${etiqueta}`}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
      >
        {copiado ? (
          <Check className="size-4 text-brand" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
