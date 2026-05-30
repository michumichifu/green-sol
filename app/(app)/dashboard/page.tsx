import Link from "next/link";
import {
  Plus,
  Calculator,
  Users,
  PiggyBank,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { obtenerUsuario } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { obtenerReputacion } from "@/lib/reputacion";
import { TasasResumen } from "@/components/tasas-resumen";
import { cn } from "@/lib/utils";

const ESTADO_ESTILO: Record<string, string> = {
  abierta: "bg-muted text-muted-foreground",
  activa: "bg-brand/10 text-brand",
  cerrada: "bg-gold/15 text-gold",
};

function Estrellas({ valor }: { valor: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(valor)
              ? "fill-gold text-gold"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const usuario = await obtenerUsuario();
  const [recolectas, reputacion] = await Promise.all([
    prisma.recolecta.findMany({
      where: { participantes: { some: { usuarioId: usuario!.id } } },
      include: { _count: { select: { participantes: true } } },
      orderBy: { creadaEn: "desc" },
      take: 4,
    }),
    obtenerReputacion(usuario!.id),
  ]);

  const nombre = usuario?.nombre?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      {/* Hero de bienvenida */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-6 text-white shadow-lg shadow-brand/20">
        <Sparkles className="absolute -right-4 -top-4 size-28 text-white/10" />
        <p className="text-sm font-medium text-white/80">
          ¡Hola{nombre ? `, ${nombre}` : ""}! 👋
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">
          Tu ahorro, claro y en orden.
        </h1>
        <div className="mt-4 flex items-center gap-2">
          <Estrellas valor={reputacion.estrellas} />
          <span className="text-xs text-white/80">
            {reputacion.total > 0
              ? `${reputacion.estrellas} · ${reputacion.total} valoración(es)`
              : "Aún sin valoraciones"}
          </span>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/sanes/crear"
          className="flex flex-col gap-2 rounded-2xl bg-brand p-4 text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
            <Plus className="size-5" />
          </span>
          <span className="text-sm font-semibold">Nuevo ahorro</span>
          <span className="text-xs text-white/80">San o vaca</span>
        </Link>
        <Link
          href="/calculadora"
          className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Calculator className="size-5" />
          </span>
          <span className="text-sm font-semibold">Calculadora</span>
          <span className="text-xs text-muted-foreground">Bs · USDC · SOL</span>
        </Link>
      </section>

      {/* Tasas de hoy */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tasas de hoy</h2>
          <Link href="/calculadora" className="text-xs text-brand">
            Convertir
          </Link>
        </div>
        <TasasResumen />
      </section>

      {/* Tus ahorros */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tus ahorros</h2>
          {recolectas.length > 0 && (
            <Link
              href="/sanes"
              className="flex items-center gap-1 text-xs text-brand"
            >
              Ver todos <ArrowRight className="size-3" />
            </Link>
          )}
        </div>

        {recolectas.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <PiggyBank className="size-6" />
            </span>
            <p className="text-sm font-medium">Todavía no tienes ahorros</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea un san por turnos o una vaca con meta común.
            </p>
            <Link
              href="/sanes/crear"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white"
            >
              <Plus className="size-4" /> Crear el primero
            </Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {recolectas.map((r) => {
              const esSan = r.tipo === "san";
              return (
                <li key={r.id}>
                  <Link
                    href={`/sanes/${r.id}`}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-colors hover:border-brand/40"
                  >
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl",
                        esSan
                          ? "bg-brand/10 text-brand"
                          : "bg-gold/15 text-gold",
                      )}
                    >
                      {esSan ? (
                        <Users className="size-5" />
                      ) : (
                        <PiggyBank className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {esSan ? "San · por turnos" : "Vaca · meta común"} ·{" "}
                        {r._count.participantes} participante(s)
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase",
                        ESTADO_ESTILO[r.estado] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.estado}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
