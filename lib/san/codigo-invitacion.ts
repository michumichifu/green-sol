import { randomInt } from "crypto";

/** Alfabeto sin caracteres ambiguos (sin 0/O/1/I/L) para códigos de invitación. */
export const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LONGITUD = 6;

/** Genera un código corto legible de {@link LONGITUD} caracteres. No es único por sí solo:
 * el llamador debe reintentar ante colisión con el índice @unique de `Invitacion.codigo`. */
export function nuevoCodigo(): string {
  let codigo = "";
  for (let i = 0; i < LONGITUD; i++) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}
