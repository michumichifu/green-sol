"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Da la percepción de "bloqueado" sin bloquear: difumina su contenido con un velo
 * traslúcido y un ojo para revelarlo (y volver a ocultarlo). Si `velar` es false,
 * muestra el contenido tal cual.
 */
export function VeloRevelable({
  velar = true,
  children,
}: {
  velar?: boolean;
  children: ReactNode;
}) {
  const [revelado, setRevelado] = useState(false);
  if (!velar) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className={
          revelado ? "" : "pointer-events-none select-none blur-[6px]"
        }
        aria-hidden={!revelado}
      >
        {children}
      </div>

      {!revelado ? (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="absolute inset-0 flex items-center justify-center bg-background/30"
          aria-label="Ver información"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-foreground/75 px-3 py-1.5 text-xs font-medium text-background shadow">
            <Eye className="size-4" /> Ver
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setRevelado(false)}
          className="absolute right-2 top-2 rounded-full bg-foreground/10 p-1.5 text-muted-foreground hover:bg-foreground/20"
          aria-label="Ocultar de nuevo"
        >
          <EyeOff className="size-4" />
        </button>
      )}
    </div>
  );
}
