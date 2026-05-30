// Decide si mostrar el introductorio (onboarding).
// Se deja de mostrar cuando el usuario lo ha cerrado >= 3 veces
// o ya ha ingresado más de 7 veces (se asume que ya conoce la app).
export function debeMostrarOnboarding(u: {
  onboardingCerrado: number;
  ingresos: number;
}): boolean {
  return u.onboardingCerrado < 3 && u.ingresos <= 7;
}
