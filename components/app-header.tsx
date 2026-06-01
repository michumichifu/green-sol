"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import {
  marcarTodasLeidas,
  marcarLeida,
  eliminarNotificacion,
} from "@/app/(app)/notificaciones/actions";
import { cn } from "@/lib/utils";

type Noti = {
  id: string;
  titulo: string;
  cuerpo: string | null;
  leida: boolean;
};

export function AppHeader({
  notis,
  nivelNum,
  nivelNombre,
}: {
  notis: Noti[];
  noLeidas: number;
  nivelNum: number;
  nivelNombre: string;
}) {
  const [verNotis, setVerNotis] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [lista, setLista] = useState(notis);
  const btnRef = useRef<HTMLButtonElement>(null);
  const sinLeer = lista.filter((n) => !n.leida).length;

  // Resincroniza con el servidor cuando llegan notis nuevas tras revalidar
  // (p. ej. al agregar/quitar un método de seguridad o de pago).
  const firma = notis.map((n) => `${n.id}:${n.leida ? 1 : 0}`).join("|");
  useEffect(() => {
    setLista(notis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);

  function abrir() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }
    setVerNotis(true);
  }
  function marcar(id: string) {
    setLista((l) => l.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    marcarLeida(id);
  }
  function eliminar(id: string) {
    setLista((l) => l.filter((n) => n.id !== id));
    eliminarNotificacion(id);
  }
  function marcarTodas() {
    setLista((l) => l.map((n) => ({ ...n, leida: true })));
    marcarTodasLeidas();
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 pb-3 pt-[max(2.75rem,calc(env(safe-area-inset-top)+0.6rem))] backdrop-blur">
      <div className="flex items-center gap-2.5">
        <Link href="/dashboard" aria-label="Inicio" className="ml-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/green-sol-logo.svg" alt="Green Sol" className="size-12" />
        </Link>
        <Link
          href="/recompensa"
          className="rounded-full border border-brand/30 bg-brand/5 px-2.5 py-1 text-xs font-semibold text-brand"
        >
          Nivel {nivelNum} · {nivelNombre}
        </Link>
      </div>

      <button
        ref={btnRef}
        type="button"
        onClick={() => (verNotis ? setVerNotis(false) : abrir())}
        aria-label="Avisos y notificaciones"
        className="relative flex size-9 items-center justify-center rounded-full hover:bg-muted"
      >
        <Bell className="size-5" />
        {sinLeer > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
            {sinLeer > 9 ? "9+" : sinLeer}
          </span>
        )}
      </button>

      {verNotis &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setVerNotis(false)}
            />
            <div
              className="fixed z-50 w-80 max-w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-top-2 rounded-xl border bg-card p-3 shadow-xl duration-200"
              style={{ top: pos.top, right: pos.right }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">Avisos y notificaciones</span>
                {sinLeer > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodas}
                    className="text-xs text-brand"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              {lista.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tienes avisos.
                </p>
              ) : (
                <ul className="max-h-80 space-y-1 overflow-y-auto">
                  {lista.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex items-start gap-1.5 rounded-lg p-2",
                        n.leida ? "" : "bg-brand/5",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => marcar(n.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <p className="flex-1 text-sm font-medium">{n.titulo}</p>
                          {!n.leida && (
                            <span
                              className="size-2 shrink-0 rounded-full bg-gold"
                              aria-label="No leída"
                            />
                          )}
                        </div>
                        {n.cuerpo && (
                          <p className="text-xs text-muted-foreground">
                            {n.cuerpo}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(n.id)}
                        aria-label="Borrar aviso"
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
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
          </>,
          document.body,
        )}
    </header>
  );
}
