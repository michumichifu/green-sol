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
    img: "/metodo-san.svg",
    icon: RefreshCw,
    tag: "Por turnos",
    tagColor: "bg-brand/10 text-brand",
    titulo: "San · Susi · Bolso",
    resumen:
      "Cada ronda (semanal, quincenal o mensual) todos aportan al mismo tiempo. Lo que rota es el cobro: por turno, a una persona le toca llevarse el bote completo, y la siguiente ronda le toca a otra, hasta que todos cobran.",
    provecho:
      "Ideal para ahorrar con disciplina y recibir un monto grande de golpe, sin intereses.",
  },
  {
    img: "/metodo-bolso.svg",
    icon: Target,
    tag: "Meta común",
    tagColor: "bg-gold/15 text-gold",
    titulo: "Vaca · Pote",
    resumen:
      "Varias personas aportan dinero para reunir entre todas y alcanzar un objetivo o meta común. Al llegar a la meta, se usa o se reparte. No hay turnos.",
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
              className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm"
            >
              {/* Categoría */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${m.tagColor}`}
              >
                <Icon className="size-3.5" /> {m.tag}
              </span>

              {/* Título */}
              <h2 className="text-lg font-bold">{m.titulo}</h2>

              {/* Imagen (al centro) */}
              <div className="flex items-center justify-center rounded-2xl bg-muted/40 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.img}
                  alt=""
                  className="h-28 w-28 object-contain drop-shadow"
                />
              </div>

              {/* Descripción */}
              <p className="text-sm text-muted-foreground">{m.resumen}</p>

              {/* Tip */}
              <div className="flex items-start gap-2 rounded-xl bg-brand/5 p-3">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                <p className="text-sm font-medium">{m.provecho}</p>
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
