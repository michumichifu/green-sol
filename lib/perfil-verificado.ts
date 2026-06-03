/** Ruta del flujo de verificación de perfil (KYC) del usuario. */
export const RUTA_VERIFICACION = "/configuracion?tab=verificacion";

/**
 * Perfil verificado = KYC aprobado (`nivelKyc >= 1`). Mismo criterio que usan el
 * admin, el perfil y el dashboard. Es el "portero" para participar en un ahorro.
 */
export function perfilVerificado(u: { nivelKyc: number }): boolean {
  return u.nivelKyc >= 1;
}
