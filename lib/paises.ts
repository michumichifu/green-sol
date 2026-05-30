export type Pais = {
  codigo: string;
  nombre: string;
  moneda: string;
  especial?: boolean; // tratamiento especial de cotización (Venezuela)
};

// Latinoamérica + EE.UU. Venezuela es la excepción (cotizadores BCV/USDT).
export const PAISES: Pais[] = [
  { codigo: "VE", nombre: "Venezuela", moneda: "VES", especial: true },
  { codigo: "MX", nombre: "México", moneda: "MXN" },
  { codigo: "CO", nombre: "Colombia", moneda: "COP" },
  { codigo: "AR", nombre: "Argentina", moneda: "ARS" },
  { codigo: "PE", nombre: "Perú", moneda: "PEN" },
  { codigo: "CL", nombre: "Chile", moneda: "CLP" },
  { codigo: "EC", nombre: "Ecuador", moneda: "USD" },
  { codigo: "BO", nombre: "Bolivia", moneda: "BOB" },
  { codigo: "UY", nombre: "Uruguay", moneda: "UYU" },
  { codigo: "PY", nombre: "Paraguay", moneda: "PYG" },
  { codigo: "DO", nombre: "República Dominicana", moneda: "DOP" },
  { codigo: "PA", nombre: "Panamá", moneda: "USD" },
  { codigo: "CR", nombre: "Costa Rica", moneda: "CRC" },
  { codigo: "GT", nombre: "Guatemala", moneda: "GTQ" },
  { codigo: "HN", nombre: "Honduras", moneda: "HNL" },
  { codigo: "SV", nombre: "El Salvador", moneda: "USD" },
  { codigo: "NI", nombre: "Nicaragua", moneda: "NIO" },
  { codigo: "US", nombre: "Estados Unidos", moneda: "USD" },
];

export function paisPorCodigo(codigo: string): Pais | undefined {
  return PAISES.find((p) => p.codigo === codigo);
}
