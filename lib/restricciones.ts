import { prisma } from "@/lib/db";

export const CLAVES_BLACKLIST = {
  nombre: "BLACKLIST_NOMBRE",
  apellido: "BLACKLIST_APELLIDO",
  nombreUsuario: "BLACKLIST_USUARIO",
} as const;

// Palabras que sugieren falsa autoridad y se bloquean por defecto.
const DEFAULT = [
  "admin",
  "administrador",
  "administradora",
  "administracion",
  "dueno",
  "owner",
  "programador",
  "programadora",
  "organizador",
  "organizadora",
  "moderador",
  "moderadora",
  "soporte",
  "support",
  "root",
  "sistema",
  "system",
  "oficial",
  "staff",
  "ceo",
  "jefe",
  "greensol",
  "green sol",
];

export const RESTRICCIONES_DEFAULT = {
  nombre: DEFAULT,
  apellido: DEFAULT,
  nombreUsuario: DEFAULT,
};

const ETIQUETA = {
  nombre: "el nombre",
  apellido: "el apellido",
  nombreUsuario: "el nombre de usuario",
} as const;

function normaliza(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function parseLista(valor: string | undefined, fallback: string[]): string[] {
  if (!valor || !valor.trim()) return fallback;
  return valor
    .split(/[\n,]+/)
    .map((s) => normaliza(s))
    .filter(Boolean);
}

export async function obtenerRestricciones() {
  const filas = await prisma.configuracionApp.findMany({
    where: { clave: { in: Object.values(CLAVES_BLACKLIST) } },
  });
  const map = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  return {
    nombre: parseLista(map[CLAVES_BLACKLIST.nombre], RESTRICCIONES_DEFAULT.nombre),
    apellido: parseLista(
      map[CLAVES_BLACKLIST.apellido],
      RESTRICCIONES_DEFAULT.apellido,
    ),
    nombreUsuario: parseLista(
      map[CLAVES_BLACKLIST.nombreUsuario],
      RESTRICCIONES_DEFAULT.nombreUsuario,
    ),
  };
}

/** Listas efectivas como texto (coma) para editar en el panel. */
export async function obtenerRestriccionesTexto() {
  const r = await obtenerRestricciones();
  return {
    nombre: r.nombre.join(", "),
    apellido: r.apellido.join(", "),
    nombreUsuario: r.nombreUsuario.join(", "),
  };
}

/** Mensaje de error si algún campo contiene una palabra restringida, o null. */
export async function validarRestricciones(campos: {
  nombre?: string | null;
  apellido?: string | null;
  nombreUsuario?: string | null;
}): Promise<string | null> {
  const r = await obtenerRestricciones();
  for (const campo of ["nombre", "apellido", "nombreUsuario"] as const) {
    const valor = campos[campo];
    if (!valor) continue;
    const norm = normaliza(valor);
    const palabra = r[campo].find((w) => w && norm.includes(w));
    if (palabra) {
      return `No puedes usar "${palabra}" en ${ETIQUETA[campo]}.`;
    }
  }
  return null;
}
