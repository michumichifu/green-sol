import { z } from "zod";

export const contrasenaSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[0-9]/, "Al menos un número")
  .regex(/[^A-Za-z0-9]/, "Al menos un símbolo");

export const registroSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: contrasenaSchema,
});

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(1, "Requerida"),
});

export const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});
