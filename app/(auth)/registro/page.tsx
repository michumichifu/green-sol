import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIE_PENDIENTE } from "../constants";
import { RegistroWizard } from "./wizard";

/**
 * Detecta en qué paso del registro se encuentra el usuario:
 * - paso 1: correo (estado inicial o usuario no verificado sin cookie)
 * - paso 2: PIN (correo verificado, sin PIN aún)
 * - paso 3: datos (correo verificado + PIN, sin datos aún)
 *
 * Si el usuario ya completó el registro (correoVerificado + pinHash + nombreUsuario),
 * muestra paso 1 de todas formas (el flujo es idempotente).
 */
async function detectarPasoInicial(): Promise<1 | 2 | 3> {
  const cookieStore = await cookies();
  const correo = cookieStore.get(COOKIE_PENDIENTE)?.value;
  if (!correo) return 1;

  const usuario = await prisma.usuario.findUnique({ where: { correo } });
  if (!usuario) return 1;
  if (!usuario.correoVerificado) return 1;
  if (!usuario.pinHash) return 2;
  if (!usuario.nombreUsuario) return 3;
  return 1;
}

export default async function RegistroPage() {
  const pasoInicial = await detectarPasoInicial();
  return <RegistroWizard pasoInicial={pasoInicial} />;
}
