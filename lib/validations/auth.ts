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
      .max(15, "Máximo 15 caracteres")
      .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
    pais: z.string().min(2, "Elige tu país"),
  })
  .refine((d) => d.contrasena === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

// Login: acepta correo o nombre de usuario
export const loginSchema = z.object({
  // trim: evita que un espacio del autocompletado (típico en el correo) impida
  // encontrar la cuenta. La búsqueda por correo además normaliza a minúsculas.
  identificador: z.string().trim().min(1, "Correo o nombre de usuario"),
  contrasena: z.string().min(1, "Requerida"),
});

export const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});

// PIN: definición y confirmación
export const pinSchema = z
  .object({
    pin: z.string().regex(/^\d{6}$/, "El PIN es de 6 dígitos"),
    confirmar: z.string(),
  })
  .refine((d) => d.pin === d.confirmar, {
    message: "Los PIN no coinciden",
    path: ["confirmar"],
  });

// Datos del registro (sin credencial; el PIN se define en su propio paso)
export const registroDatosSchema = z.object({
  nombre: z.string().min(1, "Indica tu nombre"),
  apellido: z.string().min(1, "Indica tu apellido"),
  nombreUsuario: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(15, "Máximo 15 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guion bajo"),
  pais: z.string().min(2, "Elige tu país"),
});

// Login: correo/usuario + PIN
export const loginPinSchema = z.object({
  identificador: z.string().trim().min(1, "Correo o nombre de usuario"),
  pin: z.string().regex(/^\d{6}$/, "PIN de 6 dígitos"),
});
