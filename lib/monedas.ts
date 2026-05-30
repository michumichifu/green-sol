export type MonedaFiat = {
  codigo: string;
  prefijo: string;
  nombre: string;
  pais: string;
};

// Monedas fiat (Latinoamérica + USD). El buscador permite filtrar por prefijo,
// nombre o país. Venezuela y USD son las prioritarias del MVP.
export const MONEDAS_FIAT: MonedaFiat[] = [
  { codigo: "VES", prefijo: "Bs", nombre: "Bolívar", pais: "Venezuela" },
  { codigo: "USD", prefijo: "$", nombre: "Dólar", pais: "Estados Unidos" },
  { codigo: "MXN", prefijo: "$", nombre: "Peso", pais: "México" },
  { codigo: "COP", prefijo: "$", nombre: "Peso", pais: "Colombia" },
  { codigo: "ARS", prefijo: "$", nombre: "Peso", pais: "Argentina" },
  { codigo: "PEN", prefijo: "S/", nombre: "Sol", pais: "Perú" },
  { codigo: "CLP", prefijo: "$", nombre: "Peso", pais: "Chile" },
  { codigo: "BOB", prefijo: "Bs", nombre: "Boliviano", pais: "Bolivia" },
  { codigo: "UYU", prefijo: "$", nombre: "Peso", pais: "Uruguay" },
  { codigo: "PYG", prefijo: "₲", nombre: "Guaraní", pais: "Paraguay" },
  { codigo: "DOP", prefijo: "RD$", nombre: "Peso", pais: "República Dominicana" },
  { codigo: "CRC", prefijo: "₡", nombre: "Colón", pais: "Costa Rica" },
  { codigo: "GTQ", prefijo: "Q", nombre: "Quetzal", pais: "Guatemala" },
  { codigo: "HNL", prefijo: "L", nombre: "Lempira", pais: "Honduras" },
  { codigo: "NIO", prefijo: "C$", nombre: "Córdoba", pais: "Nicaragua" },
];

export function monedaFiat(codigo: string): MonedaFiat | undefined {
  return MONEDAS_FIAT.find((m) => m.codigo === codigo);
}

// Métodos de pago disponibles por moneda fiat.
export const METODOS_POR_MONEDA: Record<
  string,
  { id: string; label: string }[]
> = {
  VES: [
    { id: "transferencia", label: "Transferencia" },
    { id: "pago_movil", label: "Pago móvil" },
  ],
  USD: [
    { id: "efectivo", label: "Efectivo" },
    { id: "zelle", label: "Zelle" },
    { id: "zinli", label: "Zinli" },
    { id: "walytech", label: "WalyTech" },
    { id: "banco", label: "Banco (USD)" },
  ],
};

// Para el resto de monedas, métodos genéricos.
export const METODOS_GENERICOS = [
  { id: "transferencia", label: "Transferencia / cuenta" },
  { id: "efectivo", label: "Efectivo" },
];

export const METODO_LABEL: Record<string, string> = {
  transferencia: "Transferencia",
  pago_movil: "Pago móvil",
  efectivo: "Efectivo",
  zelle: "Zelle",
  zinli: "Zinli",
  walytech: "WalyTech",
  banco: "Banco",
  usdc: "USDC",
  sol: "Solana",
};

// Cripto (red Solana).
export const CRIPTO_OPCIONES = [
  { id: "usdc", label: "USDC", simbolo: "USDC" },
  { id: "sol", label: "Solana", simbolo: "SOL" },
];
