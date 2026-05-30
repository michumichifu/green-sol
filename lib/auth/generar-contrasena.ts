// Generador de contraseñas — seguro para cliente y servidor (no importa Argon2).

const MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUS = "abcdefghijkmnpqrstuvwxyz";
const NUMS = "23456789";
const SIMBOLOS = "!@#$%^&*()-_=+[]{};:,.?";

function pick(set: string): string {
  return set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
}

/** Genera una contraseña aleatoria que cumple la política (mayúscula, número, símbolo). */
export function generarContrasena(largo = 16): string {
  const base = [pick(MAYUS), pick(MINUS), pick(NUMS), pick(SIMBOLOS)];
  const todos = MAYUS + MINUS + NUMS + SIMBOLOS;
  while (base.length < largo) base.push(pick(todos));
  for (let i = base.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.join("");
}
