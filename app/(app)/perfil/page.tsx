import Link from "next/link";
import {
  Star,
  Gift,
  UserCog,
  CreditCard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerReputacion, nivelPorReputacion } from "@/lib/reputacion";
import { cerrarSesionAction } from "@/app/(auth)/actions";

function ItemMenu({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Gift;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60"
    >
      <Icon className="size-5 text-brand" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

export default async function PerfilPage() {
  const sesion = await obtenerUsuario();
  const usuario = await prisma.usuario.findUnique({
    where: { id: sesion!.id },
  });
  const rep = await obtenerReputacion(usuario!.id);
  const nivel = nivelPorReputacion(rep);
  const esAdmin = usuario!.rol === "super_admin";

  const nombreCompleto =
    [usuario!.nombre, usuario!.apellido].filter(Boolean).join(" ") || "Tu perfil";
  const inicial = (usuario!.nombre ?? usuario!.correo).charAt(0).toUpperCase();

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      {/* Tarjeta de identidad */}
      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{nombreCompleto}</p>
            {usuario!.nombreUsuario && (
              <p className="truncate text-sm text-brand">
                @{usuario!.nombreUsuario}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand to-brand-2 p-3 text-white">
          <div>
            <p className="text-[11px] text-white/80">Nivel</p>
            <p className="font-bold">{nivel.actual.nombre}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <Star className="size-4 fill-gold text-gold" />
            <span className="font-bold">{nivel.puntos}</span>
            <span className="text-xs text-white/80">pts</span>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {rep.positivos} positivos · {rep.negativos} negativos
        </p>
      </section>

      {/* Menú */}
      <nav className="divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
        <ItemMenu href="/recompensa" icon={Gift} label="Tu recompensa" />
        <ItemMenu href="/configuracion?tab=datos" icon={UserCog} label="Tus datos" />
        <ItemMenu
          href="/configuracion?tab=pagos"
          icon={CreditCard}
          label="Métodos de pago"
        />
        <ItemMenu href="/ayuda" icon={LifeBuoy} label="Centro de ayuda" />
        <ItemMenu href="/configuracion" icon={Settings} label="Configuración" />
        {esAdmin && (
          <ItemMenu
            href="/admin"
            icon={ShieldCheck}
            label="Panel super-admin"
          />
        )}
      </nav>

      <form action={cerrarSesionAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-card py-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </form>
    </main>
  );
}
