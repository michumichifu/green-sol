import { z } from "zod";

export const MONEDAS_RECOLECTA = [
  "bs_bcv",
  "bs_usdt",
  "usdt",
  "usdc",
  "sol",
] as const;

export const FRECUENCIAS = ["semanal", "quincenal", "mensual"] as const;

// Etiqueta y símbolo de cada moneda de recolecta.
export const MONEDA_RECOLECTA: Record<
  string,
  { label: string; simbolo: string }
> = {
  bs_bcv: { label: "Bolívares (tasa BCV)", simbolo: "Bs" },
  bs_usdt: { label: "Bolívares (paralelo / USDT)", simbolo: "Bs" },
  usdt: { label: "USDT", simbolo: "USDT" },
  usdc: { label: "USDC (Solana)", simbolo: "USDC" },
  sol: { label: "Solana", simbolo: "SOL" },
  // compatibilidad con recolectas viejas
  USD: { label: "Dólar", simbolo: "$" },
};

export const FRECUENCIA_LABEL: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
};

export const crearRecolectaSchema = z
  .object({
    tipo: z.enum(["san", "vaca"]),
    nombre: z.string().min(2, "Ponle un nombre").max(80),
    visibilidad: z.enum(["privado", "publico"]),
    moneda: z.enum(MONEDAS_RECOLECTA),
    monto: z.coerce.number().positive("Debe ser mayor a 0"),
    frecuencia: z.enum(FRECUENCIAS).optional(),
    cupoMiembros: z.coerce
      .number()
      .int()
      .min(2, "Mínimo 2 personas")
      .max(50, "Máximo 50")
      .optional(),
  })
  .refine((d) => d.tipo !== "san" || !!d.frecuencia, {
    message: "Elige cada cuánto se aporta",
    path: ["frecuencia"],
  })
  .refine((d) => d.tipo !== "san" || !!d.cupoMiembros, {
    message: "Indica cuántas manos (personas)",
    path: ["cupoMiembros"],
  });
