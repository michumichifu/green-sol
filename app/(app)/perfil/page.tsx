import Link from "next/link";
import {
  Star,
  Gift,
  UserCog,
  CreditCard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  BadgeCheck,
  ShieldAlert,
  ScrollText,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerReputacion, nivelPorReputacion } from "@/lib/reputacion";
import { BannerVerificacion } from "@/components/banner-verificacion";
import { BotonCerrarSesion } from "@/components/boton-cerrar-sesion";
import { DatoCopiable } from "@/components/dato-copiable";

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
  // El PIN ya se crea en el registro; la verificación pendiente para el usuario es el KYC.
  const verificacionCompleta = usuario!.nivelKyc >= 1;

  const nombreCompleto =
    [usuario!.nombre, usuario!.apellido].filter(Boolean).join(" ") || "Tu perfil";
  const inicial = (usuario!.nombre ?? usuario!.correo ?? usuario!.nombreUsuario ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-md space-y-5 px-5 py-6">
      {/* Tarjeta de identidad */}
      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl font-bold text-brand">
            {inicial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-lg font-bold">{nombreCompleto}</p>
              {usuario!.nivelKyc >= 1 ? (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                  <BadgeCheck className="size-3" /> Verificado
                </span>
              ) : (
                <Link
                  href="/configuracion?tab=verificacion"
                  className="flex shrink-0 items-center gap-0.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold"
                >
                  <ShieldAlert className="size-3" /> Sin verificar
                </Link>
              )}
            </div>
            {usuario!.nombreUsuario && (
              <p className="truncate text-sm text-brand">
                @{usuario!.nombreUsuario}
              </p>
            )}
          </div>
        </div>

        <BannerVerificacion completo={verificacionCompleta} className="mt-4" />

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand to-brand-2 p-3 text-white">
          <div>
            <p className="text-[11px] text-white/80">
              Nivel {nivel.actual.indice + 1}
            </p>
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

      {/* Identidad por wallet (registro con Solana) */}
      {usuario!.registradoCon === "wallet" && usuario!.walletAddress && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Wallet className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold leading-tight">
                Registrado con wallet
              </h2>
              <p className="text-xs text-muted-foreground">
                Tu identidad es tu wallet de Solana.
              </p>
            </div>
          </div>
          <DatoCopiable etiqueta="Dirección" valor={usuario!.walletAddress} />
          {!usuario!.correo && (
            <p className="text-xs text-muted-foreground">
              Sin correo vinculado. Puedes crear un PIN en{" "}
              <Link href="/configuracion?tab=seguridad" className="text-brand underline">
                Seguridad
              </Link>{" "}
              para entrar también con @usuario + PIN.
            </p>
          )}
        </section>
      )}

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
        <ItemMenu
          href="/terminos"
          icon={ScrollText}
          label="Términos y condiciones"
        />
        {esAdmin && (
          <ItemMenu
            href="/admin"
            icon={ShieldCheck}
            label="Panel super-admin"
          />
        )}
      </nav>

      <BotonCerrarSesion />
    </main>
  );
}
