"use client";

import React from "react";
import { SolanaProvider } from "@solana/react-hooks";
import { autoDiscover, createClient } from "@solana/client";

// Cliente único de Solana para toda la app. El endpoint (devnet por defecto) deja
// listo el RPC para la fase de saldos/transacciones; la autenticación con wallet
// es off-chain (firma de mensaje) y no usa este RPC.
const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const websocketEndpoint = endpoint
  .replace("https://", "wss://")
  .replace("http://", "ws://");

const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <SolanaProvider client={solanaClient}>{children}</SolanaProvider>;
}
