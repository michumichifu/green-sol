import Link from "next/link";
import { Star, Gift, Users, ArrowLeft } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerReputacion, nivelPorReputacion } from "@/lib/reputacion";

export default async function RecompensaPage() {
  const usuario = await obtenerUsuario();
  const rep = await obtenerReputacion(usuario!.id);
  const nivel = nivelPorReputacion(rep);

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      <Link
        href="/perfil"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Perfil
      </Link>

      {/* Puntos y nivel */}
      <section className="rounded-3xl bg-gradient-to-br from-brand to-brand-2 p-6 text-white shadow-lg shadow-brand/20">
        <div className="flex items-center gap-2">
          <Star className="size-6 fill-gold text-gold" />
          <span className="text-3xl font-extrabold">{nivel.puntos}</span>
          <span className="text-sm text-white/80">puntos</span>
        </div>
        <p className="mt-1 text-sm font-medium">
          Nivel {nivel.actual.indice + 1} ·{" "}
          <span className="font-bold">{nivel.actual.nombre}</span>
        </p>

        {nivel.siguiente ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[11px] text-white/80">
              <span>Hacia {nivel.siguiente.nombre}</span>
              <span>Faltan {nivel.faltan} pts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${nivel.progreso}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/90">
            ¡Estás en el nivel máximo! 🎉
          </p>
        )}
      </section>

      {/* Cómo ganar puntos */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">¿Cómo ganas puntos?</h2>
        <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
          <Star className="size-5 shrink-0 text-gold" />
          <p className="text-sm">
            Cumpliendo tus pagos a tiempo y recibiendo valoraciones positivas de
            tu grupo de ahorro.
          </p>
        </div>
      </section>

      {/* Referidos (adelanto) */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Invita y gana junto a tu pana</h2>
        <div className="rounded-2xl border border-dashed bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-brand">
            <Users className="size-5" />
            <span className="font-semibold">+40 puntos por referido</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Comparte tu código; cuando tu pana se registre y haga su primer
            aporte, ambos ganan 40 puntos (hasta 5 referidos).
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Gift className="size-3.5" /> Próximamente
          </span>
        </div>
      </section>
    </main>
  );
}
