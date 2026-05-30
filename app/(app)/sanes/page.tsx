import Link from "next/link";
import {
  Plus,
  LogIn,
  BookOpen,
  Users,
  PiggyBank,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const ESTADO_ESTILO: Record<string, string> = {
  abierta: "bg-muted text-muted-foreground",
  activa: "bg-brand/10 text-brand",
  cerrada: "bg-gold/15 text-gold",
};

export default async function AhorrosPage() {
  const usuario = await obtenerUsuario();
  const recolectas = await prisma.recolecta.findMany({
    where: { participantes: { some: { usuarioId: usuario!.id } } },
    include: { _count: { select: { participantes: true } } },
    orderBy: { creadaEn: "desc" },
  });

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-5">
      <div>
        <h1 className="text-xl font-bold">Ahorros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea un ahorro en grupo o únete a uno con el enlace o el código que te
          compartan.
        </p>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/sanes/crear"
          className="flex flex-col gap-2 rounded-2xl bg-brand p-4 text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
            <Plus className="size-5" />
          </span>
          <span className="text-sm font-semibold">Crear ahorro</span>
          <span className="text-[11px] text-white/80">Tú lo organizas</span>
        </Link>
        <Link
          href="/sanes/unirse"
          className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
            <LogIn className="size-5" />
          </span>
          <span className="text-sm font-semibold">Unirme</span>
          <span className="text-[11px] text-muted-foreground">
            Con enlace o código
          </span>
        </Link>
      </div>

      <Link
        href="/sanes/guia"
        className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-colors hover:border-brand/40"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-gold/15 text-gold">
          <BookOpen className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">
            ¿Cómo funciona el ahorro?
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Guía rápida de los métodos
          </span>
        </span>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      {/* Tus ahorros */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Tus ahorros</h2>

        {recolectas.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <PiggyBank className="size-6" />
            </span>
            <p className="text-sm font-medium">Aún no participas en ninguno</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea tu primer ahorro o únete a uno con un código.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/sanes/crear"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white"
              >
                <Plus className="size-4" /> Crear
              </Link>
              <Link
                href="/sanes/unirse"
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium"
              >
                <LogIn className="size-4" /> Unirme
              </Link>
            </div>
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
                        esSan ? "bg-brand/10 text-brand" : "bg-gold/15 text-gold",
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
                        {r._count.participantes} miembro(s)
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
