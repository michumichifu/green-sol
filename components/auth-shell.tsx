import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export const CAMPO_FILLED =
  "h-12 rounded-xl border-transparent bg-muted/50 px-4 text-sm shadow-sm focus-visible:bg-background";

export const BOTON_DEGRADADO =
  "h-12 w-full rounded-xl bg-gradient-to-r from-brand to-brand-2 text-base font-semibold text-white shadow-lg shadow-brand/25 hover:opacity-90";

/**
 * Estructura de las pantallas de auth: zona superior con color de marca
 * (wordmark + header contextual) y una tarjeta blanca flotante con el contenido.
 */
export function AuthShell({
  variante,
  header,
  titulo,
  subtitulo,
  children,
}: {
  variante: "login" | "registro";
  header: ReactNode;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  const grad =
    variante === "registro"
      ? "from-brand-2 via-brand to-gold/80"
      : "from-brand-2 to-brand";

  return (
    <div className="relative flex flex-1 flex-col">
      <div
        className={`bg-gradient-to-br ${grad} px-6 pb-28 pt-[max(3.75rem,calc(env(safe-area-inset-top)+2rem))] text-white`}
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 text-sm">
          {header}
        </div>
        <div className="mx-auto mt-9 flex max-w-md flex-col items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/green-sol-logo.svg" alt="Green Sol" className="size-14" />
          <Wordmark size="md" className="text-white" />
        </div>
      </div>
      <div className="relative -mt-20 flex-1 px-4 pb-10">
        <div
          className="mx-auto w-full max-w-md rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-xl"
          style={{ animation: "auth-fade-up 0.5s ease-out both" }}
        >
          <div className="mb-5 space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
            {subtitulo && (
              <p className="text-sm text-muted-foreground">{subtitulo}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
