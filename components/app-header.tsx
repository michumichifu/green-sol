"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  X,
  User,
  Shield,
  Mail,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cerrarSesionAction } from "@/app/(auth)/actions";
import { marcarTodasLeidas } from "@/app/(app)/notificaciones/actions";
import { cn } from "@/lib/utils";

type Noti = {
  id: string;
  titulo: string;
  cuerpo: string | null;
  leida: boolean;
};

export function AppHeader({
  nombre,
  nombreUsuario,
  correo,
  esAdmin,
  notis,
  noLeidas,
}: {
  nombre: string;
  nombreUsuario: string;
  correo: string;
  esAdmin: boolean;
  notis: Noti[];
  noLeidas: number;
}) {
  const [verNotis, setVerNotis] = useState(false);
  const [verConfig, setVerConfig] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const enAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur">
      <Link href="/dashboard" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/green-sol-logo.svg" alt="" className="size-7" />
        <span className="font-semibold">Green Sol</span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setVerNotis(true)}
          aria-label="Avisos"
          className="relative flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <Bell className="size-5" />
          {noLeidas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setVerConfig(true)}
          aria-label="Configuración"
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <Settings className="size-5" />
        </button>
      </div>

      {verNotis && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setVerNotis(false)}
          />
          <div className="absolute right-3 top-14 z-50 w-80 max-w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-top-2 rounded-xl border bg-card p-3 shadow-xl duration-200">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">Avisos</span>
              {noLeidas > 0 && (
                <form action={marcarTodasLeidas}>
                  <button type="submit" className="text-xs text-brand">
                    Marcar leídas
                  </button>
                </form>
              )}
            </div>
            {notis.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No tienes avisos.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto">
                {notis.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "rounded-lg p-2 text-sm",
                      n.leida ? "" : "bg-brand/5",
                    )}
                  >
                    <p className="font-medium">{n.titulo}</p>
                    {n.cuerpo && (
                      <p className="text-xs text-muted-foreground">{n.cuerpo}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/notificaciones"
              onClick={() => setVerNotis(false)}
              className="mt-2 block text-center text-xs text-brand"
            >
              Ver todos
            </Link>
          </div>
        </>
      )}

      {verConfig && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-300"
            onClick={() => setVerConfig(false)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[85vw] flex-col bg-background px-5 pb-5 shadow-2xl animate-in slide-in-from-right duration-300 ease-out pt-[calc(env(safe-area-inset-top)+2rem)]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-semibold">Configuración</span>
              <button
                type="button"
                onClick={() => setVerConfig(false)}
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 rounded-xl border bg-muted/40 p-3">
              <p className="font-medium">{nombre || "Tu cuenta"}</p>
              {nombreUsuario && (
                <p className="text-xs font-medium text-brand">
                  @{nombreUsuario}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{correo}</p>
            </div>
            <nav className="flex flex-1 flex-col gap-1 text-sm">
              <Link
                href="/perfil"
                onClick={() => setVerConfig(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                <User className="size-4 text-brand" /> Perfil y datos de pago
              </Link>
              <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground">
                <Shield className="size-4" /> Seguridad
                <span className="ml-auto text-[10px] uppercase">pronto</span>
              </span>
              <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground">
                <Mail className="size-4" /> Comunicaciones
                <span className="ml-auto text-[10px] uppercase">pronto</span>
              </span>
              {esAdmin && (
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5">
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-brand" /> Modo
                    super-admin
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enAdmin}
                    aria-label="Cambiar entre modo usuario y super-admin"
                    onClick={() => {
                      setVerConfig(false);
                      router.push(enAdmin ? "/dashboard" : "/admin");
                    }}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      enAdmin ? "bg-brand" : "bg-muted-foreground/30",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                        enAdmin ? "translate-x-[22px]" : "translate-x-0.5",
                      )}
                    />
                  </button>
                </div>
              )}
            </nav>
            <form action={cerrarSesionAction} className="border-t pt-3">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </header>
  );
}
