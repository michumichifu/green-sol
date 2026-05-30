import { redirect } from "next/navigation";
import { Repeat, Target, Split, Calculator } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth/session";
import { marcarOnboardingVisto } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TARJETAS = [
  {
    icon: Repeat,
    titulo: "San / susi — por turnos",
    texto:
      "Todos aportan y, por turnos, a cada quien le toca el bote completo. Ahorro disciplinado y nuestro corazón.",
    destacado: true,
  },
  {
    icon: Target,
    titulo: "Vaca / pote — meta común",
    texto:
      "Juntan dinero hacia una meta y luego se gasta o reparte. Sin turnos.",
  },
  {
    icon: Split,
    titulo: "Dividir una cuenta",
    texto: "Reparten un gasto entre varios; cada quien ve cuánto le toca.",
  },
  {
    icon: Calculator,
    titulo: "Calculadora",
    texto: "Convierte entre Bs, USDC y SOL con las tasas del día.",
  },
];

export default async function OnboardingPage() {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-10">
      <div className="space-y-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/green-sol-logo.svg"
          alt="Green Sol"
          className="mx-auto size-14"
        />
        <h1 className="text-2xl font-bold">¿Cómo funciona Green Sol?</h1>
        <p className="text-sm text-muted-foreground">
          Dos formas de ahorrar en grupo, más herramientas.
        </p>
      </div>

      <div className="space-y-3">
        {TARJETAS.map((t) => (
          <div
            key={t.titulo}
            className={cn(
              "flex gap-3 rounded-xl border p-4",
              t.destacado ? "border-brand/40 bg-brand/5" : "bg-card",
            )}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <t.icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{t.titulo}</p>
              <p className="text-sm text-muted-foreground">{t.texto}</p>
            </div>
          </div>
        ))}
      </div>

      <form action={marcarOnboardingVisto}>
        <Button type="submit" className="w-full" size="lg">
          Empezar
        </Button>
      </form>
    </main>
  );
}
