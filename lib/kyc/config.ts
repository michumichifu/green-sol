import { prisma } from "@/lib/db";

/**
 * Pasos del KYC, configurables por el super-admin (toggles guardados en
 * ConfiguracionApp como `KYC_REQUIERE_<PASO>` = "true"/"false").
 */
export const PASOS_KYC = ["DOCUMENTO", "SELFIE", "VIDEO", "DIRECCION"] as const;
export type PasoKyc = (typeof PASOS_KYC)[number];

export const ETIQUETA_PASO: Record<PasoKyc, string> = {
  DOCUMENTO: "Documento de identidad",
  SELFIE: "Selfie",
  VIDEO: "Video de liveness",
  DIRECCION: "Dirección / residencia",
};

const DEFAULTS: Record<PasoKyc, boolean> = {
  DOCUMENTO: true,
  SELFIE: true,
  VIDEO: true,
  DIRECCION: false,
};

export type PasosRequeridos = Record<PasoKyc, boolean>;

/** Lee qué pasos están activos (default si no hay valor guardado). */
export async function pasosRequeridos(): Promise<PasosRequeridos> {
  const filas = await prisma.configuracionApp.findMany({
    where: { clave: { startsWith: "KYC_REQUIERE_" } },
  });
  const guardado = Object.fromEntries(
    filas.map((f) => [f.clave, f.valor === "true"]),
  );
  return Object.fromEntries(
    PASOS_KYC.map((p) => [
      p,
      guardado[`KYC_REQUIERE_${p}`] ?? DEFAULTS[p],
    ]),
  ) as PasosRequeridos;
}
