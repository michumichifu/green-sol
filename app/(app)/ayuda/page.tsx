import Link from "next/link";
import { ArrowLeft, HelpCircle, Mail } from "lucide-react";

const FAQ: { p: string; r: string }[] = [
  {
    p: "¿Qué es un san, susi o bolso?",
    r: "Un ahorro por turnos: todos aportan cada ronda y, por turno, a cada quien le toca recibir el bote completo.",
  },
  {
    p: "¿Y una vaca o pote?",
    r: "Un ahorro con meta común: juntan dinero hacia un objetivo y luego se reparte o se gasta. Sin turnos.",
  },
  {
    p: "¿Cómo gano puntos y subo de nivel?",
    r: "Cumpliendo tus pagos a tiempo y recibiendo valoraciones positivas de tu grupo. Pronto también con referidos.",
  },
  {
    p: "¿Puedo ahorrar en cripto?",
    r: "Sí, esa es la idea: ahorrar en Solana de forma no custodial. La integración cripto llega pronto.",
  },
];

export default function AyudaPage() {
  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <Link
        href="/perfil"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Perfil
      </Link>

      <div className="flex items-center gap-2">
        <HelpCircle className="size-6 text-brand" />
        <h1 className="text-xl font-bold">Centro de ayuda</h1>
      </div>

      <section className="space-y-2.5">
        {FAQ.map((f) => (
          <div key={f.p} className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">{f.p}</p>
            <p className="mt-1 text-sm text-muted-foreground">{f.r}</p>
          </div>
        ))}
      </section>

      <a
        href="mailto:hola@greensol.app"
        className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-medium text-white"
      >
        <Mail className="size-4" /> Escríbenos
      </a>
    </main>
  );
}
