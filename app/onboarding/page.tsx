import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth/session";
import { CarruselOnboarding } from "@/components/carrusel-onboarding";

export default async function OnboardingPage() {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");
  return <CarruselOnboarding />;
}
