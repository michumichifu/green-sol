import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { Proposito } from "@/lib/auth/wallet";

const VIGENCIA_MS = 5 * 60 * 1000; // 5 min

type NonceLike = {
  usado: boolean;
  expiraEn: Date;
  walletAddress: string;
  proposito: string;
} | null;

/** Regla pura de validez (sin DB), para poder testearla. */
export function esNonceUtilizable(
  n: NonceLike,
  address: string,
  proposito: Proposito,
  ahora: Date,
): boolean {
  if (!n) return false;
  if (n.usado) return false;
  if (n.expiraEn < ahora) return false;
  if (n.walletAddress !== address) return false;
  if (n.proposito !== proposito) return false;
  return true;
}

/** Crea y persiste un nonce nuevo para una wallet+propósito. Devuelve el string. */
export async function crearNonce(address: string, proposito: Proposito): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  await prisma.authNonce.create({
    data: {
      nonce,
      walletAddress: address,
      proposito,
      expiraEn: new Date(Date.now() + VIGENCIA_MS),
    },
  });
  return nonce;
}

/**
 * Consume un nonce: lo valida y lo marca usado. Devuelve true si era utilizable
 * (y queda marcado), false si no. Single-use: un segundo intento devuelve false.
 */
export async function consumirNonce(
  nonce: string,
  address: string,
  proposito: Proposito,
): Promise<boolean> {
  const registro = await prisma.authNonce.findUnique({ where: { nonce } });
  if (!esNonceUtilizable(registro, address, proposito, new Date())) return false;
  await prisma.authNonce.update({ where: { nonce }, data: { usado: true } });
  return true;
}
