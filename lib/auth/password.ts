import { hash, verify } from "@node-rs/argon2";

export function hashContrasena(plano: string): Promise<string> {
  return hash(plano);
}

export function verificarContrasena(
  hashGuardado: string,
  plano: string,
): Promise<boolean> {
  return verify(hashGuardado, plano);
}
