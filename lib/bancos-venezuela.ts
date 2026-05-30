export type BancoVE = { codigo: string; nombre: string };

/**
 * Lista oficial de bancos de Venezuela con su código de 4 dígitos.
 * Estos códigos se usan para transferencias y pago móvil
 * (ej. "0102" = Banco de Venezuela).
 *
 * Fuente: Banco Central de Venezuela (instituciones bancarias activas
 * en el SCCE 2025) y listados de códigos de pago móvil verificados
 * (El Estímulo, Notilogía). Ordenado por código ascendente.
 */
export const BANCOS_VE: BancoVE[] = [
  { codigo: "0102", nombre: "Banco de Venezuela" },
  { codigo: "0104", nombre: "Venezolano de Crédito" },
  { codigo: "0105", nombre: "Mercantil" },
  { codigo: "0108", nombre: "BBVA Provincial" },
  { codigo: "0114", nombre: "Bancaribe" },
  { codigo: "0115", nombre: "Banco Exterior" },
  { codigo: "0128", nombre: "Banco Caroní" },
  { codigo: "0134", nombre: "Banesco" },
  { codigo: "0137", nombre: "Sofitasa" },
  { codigo: "0138", nombre: "Banco Plaza" },
  { codigo: "0146", nombre: "Bangente" },
  { codigo: "0151", nombre: "BFC Banco Fondo Común" },
  { codigo: "0156", nombre: "100% Banco" },
  { codigo: "0157", nombre: "DelSur" },
  { codigo: "0163", nombre: "Banco del Tesoro" },
  { codigo: "0166", nombre: "Banco Agrícola de Venezuela" },
  { codigo: "0168", nombre: "Bancrecer" },
  { codigo: "0169", nombre: "Mi Banco" },
  { codigo: "0171", nombre: "Banco Activo" },
  { codigo: "0172", nombre: "Bancamiga" },
  { codigo: "0173", nombre: "Banco Internacional de Desarrollo" },
  { codigo: "0174", nombre: "Banplus" },
  { codigo: "0175", nombre: "Banco Bicentenario" },
  { codigo: "0177", nombre: "Banfanb" },
  { codigo: "0191", nombre: "BNC" },
];
