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
import { obtenerReputacion, nivelPorReputacion } from "@/lib/reputacion";
import { TasasResumen } from "@/components/tasas-resumen";
import { BannerVerificacion } from "@/components/banner-verificacion";
import { cn } from "@/lib/utils";

const ESTADO_ESTILO: Record<string, string> = {
  abierta: "bg-muted text-muted-foreground",
  activa: "bg-brand/10 text-brand",
  cerrada: "bg-gold/15 text-gold",
};

export default async function DashboardPage() {
  const usuario = await obtenerUsuario();
  const [recolectas, reputacion, verif] = await Promise.all([
    prisma.recolecta.findMany({
      where: { participantes: { some: { usuarioId: usuario!.id } } },
      include: { _count: { select: { participantes: true } } },
      orderBy: { creadaEn: "desc" },
      take: 4,
    }),
    obtenerReputacion(usuario!.id),
    prisma.usuario.findUnique({
      where: { id: usuario!.id },
      select: { pinHash: true, otpCorreoActivo: true },
    }),
  ]);
  const tiene2FA = !!verif?.pinHash || !!verif?.otpCorreoActivo;

  const nombre = usuario?.nombre?.split(" ")[0] ?? "";
  const nivel = nivelPorReputacion(reputacion);

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      {/* Hero de bienvenida */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-5 text-white shadow-lg shadow-brand/20">
        <Sparkles className="absolute -right-4 -top-4 size-28 text-white/10" />
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold">
            ¡Hola{nombre ? `, ${nombre}` : ""}! 👋
          </p>
          <Link
            href="/perfil"
            className="flex flex-col items-end gap-0.5"
          >
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-sm font-bold">
              <Star className="size-3.5 fill-gold text-gold" /> {nivel.puntos}
            </span>
            <span className="text-[10px] text-white/80">
              Nivel {nivel.actual.indice + 1} · {nivel.actual.nombre}
            </span>
          </Link>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-tight">
          Tu ahorro, claro y en orden.
        </h1>
      </section>

      <BannerVerificacion completo={tiene2FA} />

      {/* Accesos rápidos */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/sanes/crear"
          className="flex items-center gap-3 rounded-2xl bg-brand p-3.5 text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Plus className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold leading-tight">
              Nuevo ahorro
            </span>
            <span className="text-[11px] text-white/80">San o vaca</span>
          </span>
        </Link>
        <Link
          href="/calculadora"
          className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Calculator className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold leading-tight">
              Calculadora
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              Bs · USDC · SOL
            </span>
          </span>
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
