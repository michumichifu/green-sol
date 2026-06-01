import { prisma } from "@/lib/db";

const CLAVES_SMTP = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE",
] as const;

export const CLAVES_APP = [
  "APP_NOMBRE",
  "APP_DESCRIPCION",
  "APP_CORREO_CONTACTO",
  "APP_LOGO_URL",
  "APP_FAVICON_URL",
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

export async function obtenerConfigApp(): Promise<Record<string, string>> {
  const filas = await prisma.configuracionApp.findMany({
    where: { clave: { in: [...CLAVES_APP] } },
  });
  return Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
}

/** Overrides de plantillas guardados (claves PLANTILLA_*). */
export async function obtenerPlantillasGuardadas(): Promise<
  Record<string, string>
> {
  const filas = await prisma.configuracionApp.findMany({
    where: { clave: { startsWith: "PLANTILLA_" } },
  });
  return Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
}

export async function borrarConfig(claves: string[]): Promise<void> {
  await prisma.configuracionApp.deleteMany({ where: { clave: { in: claves } } });
}
