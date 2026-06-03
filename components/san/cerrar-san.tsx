"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CampoPin } from "@/components/campo-pin";
import { cerrarRecolecta } from "@/app/(app)/sanes/actions";

/** Cierra el san con confirmación por PIN (acción irreversible). */
export function CerrarSan({ recolectaId }: { recolectaId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pin, setPin] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState("");

  async function cerrar() {
    setCerrando(true);
    setError("");
    const res = await cerrarRecolecta(recolectaId, pin);
    setCerrando(false);
    if (res?.error) setError(res.error);
    else {
      setConfirmando(false);
      router.refresh();
    }
  }

  if (!confirmando) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="w-full text-destructive"
        onClick={() => setConfirmando(true)}
      >
        Cerrar recolecta
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
      <p className="text-sm font-medium text-destructive">
        Cerrar el san es irreversible.
      </p>
      <p className="text-xs text-muted-foreground">
        Confirma con tu PIN para cerrarlo.
      </p>
      <CampoPin onChange={setPin} testId="cerrar-pin" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => {
            setConfirmando(false);
            setError("");
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={cerrar}
          disabled={cerrando || !/^\d{6}$/.test(pin)}
        >
          {cerrando ? "Cerrando..." : "Confirmar cierre"}
        </Button>
      </div>
    </div>
  );
}
