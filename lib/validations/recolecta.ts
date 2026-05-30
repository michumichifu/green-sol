import { z } from "zod";

// Monedas ofrecidas al crear (USDT suelto se quitó: es dólar físico; el paralelo
// se representa como "Bolívares — paralelo / USDT").
export const MONEDAS_RECOLECTA = ["bs_bcv", "bs_usdt", "usdc", "sol"] as const;

// Frecuencias predefinidas (días). El usuario también puede poner días a medida.
export const FRECUENCIAS_PRESET: { id: string; label: string; dias: number }[] =
  [
    { id: "semanal", label: "Semanal", dias: 7 },
    { id: "quincenal", label: "Quincenal", dias: 15 },
    { id: "mensual", label: "Mensual", dias: 30 },
  ];

// label: nombre de la moneda. simbolo: moneda de pago. ancla: en qué se fija el monto.
export const MONEDA_RECOLECTA: Record<
  string,
  { label: string; simbolo: string; ancla: string; enBolivares: boolean }
> = {
  bs_bcv: {
    label: "Bolívares — dólar BCV",
    simbolo: "Bs",
    ancla: "$",
    enBolivares: true,
  },
  bs_usdt: {
    label: "Bolívares — paralelo (USDT)",
    simbolo: "Bs",
    ancla: "$",
    enBolivares: true,
  },
  usdc: { label: "USDC (Solana)", simbolo: "USDC", ancla: "USDC", enBolivares: false },
  sol: { label: "Solana (SOL)", simbolo: "SOL", ancla: "SOL", enBolivares: false },
  // compatibilidad con recolectas viejas
  usdt: { label: "USDT", simbolo: "USDT", ancla: "USDT", enBolivares: false },
  USD: { label: "Dólar", simbolo: "$", ancla: "$", enBolivares: false },
};

export const FRECUENCIA_LABEL: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  personalizado: "Personalizada",
};

export const crearRecolectaSchema = z
  .object({
    tipo: z.enum(["san", "vaca"]),
    nombre: z.string().min(2, "Ponle un título").max(80),
    descripcion: z.string().max(300).optional(),
    visibilidad: z.enum(["privado", "publico"]),
    moneda: z.enum(MONEDAS_RECOLECTA),
    // Para san: meta por turno. Para vaca: meta a juntar.
    monto: z.coerce.number().positive("Debe ser mayor a 0"),
    cupoMiembros: z.coerce
      .number()
      .int()
      .min(2, "Mínimo 2 personas")
      .max(50, "Máximo 50")
      .optional(),
    frecuencia: z.string().optional(),
    frecuenciaDias: z.coerce
      .number()
      .int()
      .min(1, "Mínimo 1 día")
      .max(365, "Máximo 365")
      .optional(),
  })
  .refine((d) => d.tipo !== "san" || !!d.cupoMiembros, {
    message: "Indica cuántas personas participan",
    path: ["cupoMiembros"],
  })
  .refine((d) => d.tipo !== "san" || !!d.frecuenciaDias, {
    message: "Elige cada cuánto se aporta",
    path: ["frecuenciaDias"],
  });
