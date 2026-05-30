import { describe, it, expect } from "vitest";
import { contrasenaSchema } from "@/lib/validations/auth";
import { hashContrasena, verificarContrasena } from "@/lib/auth/password";
import { generarContrasena } from "@/lib/auth/generar-contrasena";

describe("política de contraseña", () => {
  it("rechaza contraseñas débiles", () => {
    expect(contrasenaSchema.safeParse("abc").success).toBe(false);
    expect(contrasenaSchema.safeParse("alllowercase1!").success).toBe(false);
    expect(contrasenaSchema.safeParse("NoSymbol123").success).toBe(false);
  });
  it("acepta contraseñas fuertes", () => {
    expect(contrasenaSchema.safeParse("Fuerte123!").success).toBe(true);
  });
});

describe("hash de contraseña", () => {
  it("hashea y verifica correctamente", async () => {
    const h = await hashContrasena("Fuerte123!");
    expect(await verificarContrasena(h, "Fuerte123!")).toBe(true);
    expect(await verificarContrasena(h, "incorrecta")).toBe(false);
  });
});

describe("generador de contraseña", () => {
  it("genera contraseñas que cumplen la política", () => {
    for (let i = 0; i < 20; i++) {
      expect(contrasenaSchema.safeParse(generarContrasena()).success).toBe(true);
    }
  });
});
