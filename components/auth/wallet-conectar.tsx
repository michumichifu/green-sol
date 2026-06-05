"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import bs58 from "bs58";
import { generarNonceWallet } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const WALLETS_SOPORTADAS = ["Phantom", "Solflare"];

type Props = {
  proposito: "registro" | "login";
  onFirmado: (datos: { address: string; firma: string; nonce: string }) => void;
  onError: (mensaje: string) => void;
};

/**
 * Conecta una wallet de Solana (Phantom/Solflare) y firma un mensaje con el nonce
 * del servidor. Devuelve { address, firma (base58), nonce } al padre. La firma es
 * off-chain (no gasta SOL ni toca la red): solo prueba que la wallet es del usuario.
 */
export function WalletConectar({ proposito, onFirmado, onError }: Props) {
  const { connect, connectors, isReady } = useWalletConnection();
  const [procesando, setProcesando] = useState<string | null>(null);

  const disponibles = connectors.filter((c) =>
    WALLETS_SOPORTADAS.some((w) =>
      c.name.toLowerCase().includes(w.toLowerCase()),
    ),
  );

  async function conectarYFirmar(connectorId: string) {
    setProcesando(connectorId);
    try {
      const session = await connect(connectorId);
      const address = String(session.account.address);
      if (!session.signMessage) {
        throw new Error("Esta wallet no permite firmar mensajes.");
      }
      const { mensaje, nonce } = await generarNonceWallet(address, proposito);
      const firmaBytes = await session.signMessage(
        new TextEncoder().encode(mensaje),
      );
      onFirmado({ address, firma: bs58.encode(firmaBytes), nonce });
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      if (/reject|denied|cancel|user/i.test(msg)) {
        onError("Cancelaste la firma en tu wallet. Intenta de nuevo.");
      } else {
        onError(msg || "No se pudo conectar la wallet.");
      }
    } finally {
      setProcesando(null);
    }
  }

  if (!isReady) {
    return <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />;
  }

  if (disponibles.length === 0) {
    return (
      <div className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          No detectamos una wallet de Solana
        </p>
        <p className="mt-1">Instala una para continuar:</p>
        <div className="mt-2 flex justify-center gap-3">
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand underline"
          >
            Phantom
          </a>
          <a
            href="https://solflare.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-brand underline"
          >
            Solflare
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {disponibles.map((c) => (
        <Button
          key={c.id}
          type="button"
          variant="outline"
          className="w-full justify-center"
          disabled={procesando !== null}
          onClick={() => conectarYFirmar(c.id)}
        >
          {procesando === c.id ? "Conectando…" : `Continuar con ${c.name}`}
        </Button>
      ))}
    </div>
  );
}
