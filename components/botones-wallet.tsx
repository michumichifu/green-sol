"use client";

import { toast } from "sonner";

const WALLETS = [
  { id: "phantom", nombre: "Phantom", icono: "/wallets/phantom.png", relleno: true },
  { id: "solflare", nombre: "Solflare", icono: "/wallets/solflare.jpg", relleno: true },
  { id: "metamask", nombre: "MetaMask", icono: "/wallets/metamask.png", relleno: false },
];

/**
 * Botones de wallet (Phantom / Solflare / MetaMask). Por ahora son visuales:
 * avisan que la conexión llega con la integración cripto (devnet).
 * Los logos de marco propio (Phantom, Solflare) rellenan el círculo; MetaMask
 * (logo transparente) va sobre un gris suave para contrastar.
 */
export function BotonesWallet({
  accion = "entrar",
}: {
  accion?: "entrar" | "registrarte";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          O {accion} con tu wallet
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center gap-6">
        {WALLETS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() =>
              toast(`Pronto podrás ${accion} con ${w.nombre}`, {
                description:
                  "La conexión con wallet llega con la integración cripto (devnet).",
              })
            }
            className="group flex flex-col items-center gap-1.5"
            aria-label={`${accion} con ${w.nombre}`}
          >
            <span
              className={`flex size-12 items-center justify-center overflow-hidden rounded-full border border-border/60 shadow-sm transition-transform group-hover:scale-105 ${w.relleno ? "" : "bg-muted/70"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={w.icono}
                alt={w.nombre}
                className={
                  w.relleno ? "size-full object-cover" : "size-7 object-contain"
                }
              />
            </span>
            <span className="text-xs font-medium">{w.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
