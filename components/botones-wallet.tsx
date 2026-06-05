"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWalletConnection } from "@solana/react-hooks";
import { toast } from "sonner";
import bs58 from "bs58";
import {
  generarNonceWallet,
  loginConWallet,
  registrarConWallet,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WALLETS = [
  { id: "phantom", nombre: "Phantom", icono: "/wallets/phantom.png", url: "https://phantom.app" },
  { id: "solflare", nombre: "Solflare", icono: "/wallets/solflare.jpg", url: "https://solflare.com" },
];

type Firmado = { address: string; firma: string; nonce: string };

/**
 * Botones de wallet (Phantom / Solflare) con conexión real de Solana. Conecta la
 * wallet, firma un mensaje con el nonce del servidor (off-chain, no gasta SOL) y:
 * - login: verifica e inicia sesión;
 * - registro: pide un @usuario y crea la cuenta (identidad = wallet).
 */
export function BotonesWallet({
  accion = "entrar",
}: {
  accion?: "entrar" | "registrarte";
}) {
  const router = useRouter();
  const { connect, connectors, isReady } = useWalletConnection();
  const [procesando, setProcesando] = useState<string | null>(null);
  const proposito = accion === "registrarte" ? "registro" : "login";

  // Registro: tras firmar, pedimos @usuario antes de crear la cuenta.
  const [pendiente, setPendiente] = useState<Firmado | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [errorReg, setErrorReg] = useState("");
  const [creando, setCreando] = useState(false);

  function connectorDe(walletId: string) {
    return connectors.find((c) => c.name.toLowerCase().includes(walletId));
  }

  async function alClic(w: (typeof WALLETS)[number]) {
    const conn = connectorDe(w.id);
    if (!conn) {
      toast(`No detectamos ${w.nombre}`, {
        description: `Instálala desde ${w.url} y vuelve a intentar.`,
      });
      return;
    }
    setProcesando(w.id);
    try {
      const session = await connect(conn.id);
      const address = String(session.account.address);
      if (!session.signMessage) {
        throw new Error("Esta wallet no permite firmar mensajes.");
      }
      const { mensaje, nonce } = await generarNonceWallet(address, proposito);
      const firmaBytes = await session.signMessage(
        new TextEncoder().encode(mensaje),
      );
      const firma = bs58.encode(firmaBytes);

      if (proposito === "login") {
        const res = await loginConWallet({ address, firma, nonce });
        if (res.error) {
          toast.error(res.error);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        setPendiente({ address, firma, nonce });
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      toast.error(
        /reject|denied|cancel|user/i.test(msg)
          ? "Cancelaste la firma en tu wallet."
          : msg || "No se pudo conectar la wallet.",
      );
    } finally {
      setProcesando(null);
    }
  }

  async function crearCuenta() {
    if (!pendiente) return;
    setCreando(true);
    setErrorReg("");
    const res = await registrarConWallet({ ...pendiente, nombreUsuario });
    setCreando(false);
    if (res.error) {
      setErrorReg(res.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

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
            disabled={!isReady || procesando !== null}
            onClick={() => alClic(w)}
            className="group flex flex-col items-center gap-1.5 disabled:opacity-60"
            aria-label={`${accion} con ${w.nombre}`}
          >
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-border/60 shadow-sm transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.icono} alt={w.nombre} className="size-full object-cover" />
            </span>
            <span className="text-xs font-medium">
              {procesando === w.id ? "Conectando…" : w.nombre}
            </span>
          </button>
        ))}
      </div>

      {/* Registro con wallet: pedir @usuario tras firmar */}
      {pendiente && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setPendiente(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-sm space-y-3 rounded-3xl border bg-card p-5 shadow-2xl"
          >
            <h2 className="text-base font-semibold">Elige tu nombre de usuario</h2>
            <p className="text-xs text-muted-foreground">
              Wallet conectada: {pendiente.address.slice(0, 4)}…
              {pendiente.address.slice(-4)}
            </p>
            <div className="space-y-1">
              <Label htmlFor="wallet-usuario">@usuario</Label>
              <Input
                id="wallet-usuario"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="tu_usuario"
                autoFocus
              />
            </div>
            {errorReg && <p className="text-sm text-destructive">{errorReg}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setPendiente(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={creando || nombreUsuario.trim().length < 3}
                onClick={crearCuenta}
              >
                {creando ? "Creando…" : "Crear cuenta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
