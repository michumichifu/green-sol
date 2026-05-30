import { z } from "zod";

export const contrasenaSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[0-9]/, "Al menos un número")
  .regex(/[^A-Za-z0-9]/, "Al menos un símbolo");

// Paso 1 del registro: credenciales
export const registroPaso1Schema = z
  .object({
    correo: z.string().email("Correo inválido"),
    contrasena: contrasenaSchema,
    confirmar: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

// Registro completo (paso 1 + paso 2)
export const registroCompletoSchema = z
  .object({
    correo: z.string().email("Correo inválido"),
    contrasena: contrasenaSchema,
    confirmar: z.string(),
    nombre: z.string().min(1, "Indica tu nombre"),
    apellido: z.string().min(1, "Indica tu apellido"),
    nombreUsuario: z
      .string()
      .min(3, "Mínimo 3 caracteres")
      .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
    pais: z.string().min(2, "Elige tu país"),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

// Login: acepta correo o nombre de usuario
export const loginSchema = z.object({
  identificador: z.string().min(1, "Correo o nombre de usuario"),
  contrasena: z.string().min(1, "Requerida"),
});

export const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});
