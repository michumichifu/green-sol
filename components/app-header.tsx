"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { marcarTodasLeidas } from "@/app/(app)/notificaciones/actions";
import { cn } from "@/lib/utils";

type Noti = {
  id: string;
  titulo: string;
  cuerpo: string | null;
  leida: boolean;
};

export function AppHeader({
  notis,
  noLeidas,
  nivelNum,
  nivelNombre,
}: {
  notis: Noti[];
  noLeidas: number;
  nivelNum: number;
  nivelNombre: string;
}) {
  const [verNotis, setVerNotis] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 pb-3 pt-[max(2.75rem,calc(env(safe-area-inset-top)+0.6rem))] backdrop-blur">
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard" aria-label="Inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/green-sol-logo.svg" alt="Green Sol" className="size-9" />
        </Link>
        <Link
          href="/recompensa"
          className="rounded-full border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-semibold text-brand"
        >
          Nivel {nivelNum} · {nivelNombre}
        </Link>
      </div>

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
    </header>
  );
}
