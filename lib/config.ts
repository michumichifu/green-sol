import { prisma } from "@/lib/db";

const CLAVES_SMTP = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE",
] as const;

export async function guardarConfig(clave: string, valor: string): Promise<void> {
  await prisma.configuracionApp.upsert({
    where: { clave },
    create: { clave, valor },
    update: { valor },
  });
}

export async function obtenerConfigSmtp(): Promise<Record<string, string>> {
  const filas = await prisma.configuracionApp.findMany({
    where: { clave: { in: [...CLAVES_SMTP] } },
  });
  return Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
}
