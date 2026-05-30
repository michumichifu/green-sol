import Link from "next/link";
import { ArrowLeft, RefreshCw, Target, Receipt, Sparkles, Plus } from "lucide-react";

type Metodo = {
  img: string;
  icon: typeof RefreshCw;
  tag: string;
  tagColor: string;
  titulo: string;
  resumen: string;
  provecho: string;
};

const METODOS: Metodo[] = [
  {
    img: "/onboarding-2-san.svg",
    icon: RefreshCw,
    tag: "Por turnos",
    tagColor: "bg-brand/10 text-brand",
    titulo: "San · Susi · Bolso",
    resumen:
      "Todos aportan cada ronda y, por turno, a cada quien le toca recibir el bote completo.",
    provecho:
      "Ideal para ahorrar con disciplina y recibir un monto grande de golpe, sin intereses.",
  },
  {
    img: "/onboarding-3-vaca.svg",
    icon: Target,
    tag: "Meta común",
    tagColor: "bg-gold/15 text-gold",
    titulo: "Vaca · Pote",
    resumen:
      "Varias personas juntan dinero hacia una meta; al llegar, se reparte o se gasta. Sin turnos.",
    provecho:
      "Perfecto para un regalo, un viaje o una compra grande entre amigos o familia.",
  },
  {
    img: "/onboarding-4-dividir.svg",
    icon: Receipt,
    tag: "Repartir gasto",
    tagColor: "bg-muted text-muted-foreground",
    titulo: "Dividir una cuenta",
    resumen:
      "No es un ahorro: reparten un gasto entre varios y cada quien ve cuánto le toca pagar.",
    provecho: "Útil para una cena, un alquiler o cualquier gasto compartido.",
  },
];

export default function GuiaPage() {
  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-5">
      <Link
        href="/sanes"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Ahorros
      </Link>

      <div>
        <h1 className="text-xl font-bold">¿Cómo funciona?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dos formas de ahorrar en grupo y una para repartir gastos. Elige la
          que más te convenga.
        </p>
      </div>

      <div className="space-y-4">
        {METODOS.map((m) => {
          const Icon = m.icon;
          return (
            <article
              key={m.titulo}
              className="overflow-hidden rounded-3xl border bg-card shadow-sm"
            >
              <div className="flex items-center justify-center bg-muted/40 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.img}
                  alt=""
                  className="h-28 w-28 object-contain drop-shadow"
                />
              </div>
              <div className="space-y-2 p-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.tagColor}`}
                >
                  <Icon className="size-3.5" /> {m.tag}
                </span>
                <h2 className="text-lg font-bold">{m.titulo}</h2>
                <p className="text-sm text-muted-foreground">{m.resumen}</p>
                <div className="flex items-start gap-2 rounded-xl bg-brand/5 p-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                  <p className="text-sm font-medium">{m.provecho}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href="/sanes/crear"
        className="flex items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-semibold text-white shadow-sm"
      >
        <Plus className="size-4" /> Crear un ahorro
      </Link>
    </main>
  );
}
