"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { cerrarSesionAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

/** Botón de cerrar sesión con confirmación en un pop-up centrado (sin PIN). */
export function BotonCerrarSesion() {
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    if (!confirmar) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmar]);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-card py-3 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10"
      >
        <LogOut className="size-4" /> Cerrar sesión
      </button>

      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setConfirmar(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xs space-y-4 rounded-3xl border bg-card p-5 text-center shadow-2xl"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">¿Cerrar sesión?</h2>
              <p className="text-sm text-muted-foreground">
                Vas a salir de tu cuenta. Para volver a entrar necesitarás tu
                correo o usuario y tu PIN de seguridad.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setConfirmar(false)}
              >
                Cancelar
              </Button>
              <form action={cerrarSesionAction} className="flex-1">
                <Button type="submit" variant="destructive" className="w-full">
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
