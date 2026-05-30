import { z } from "zod";

export const crearRecolectaSchema = z.object({
  tipo: z.enum(["san", "vaca"]),
  nombre: z.string().min(2, "Ponle un nombre").max(80),
  visibilidad: z.enum(["privado", "publico"]),
  monto: z.coerce.number().positive("Debe ser mayor a 0"),
});
