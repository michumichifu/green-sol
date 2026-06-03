"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, ShieldAlert } from "lucide-react";
import { unirseARecolecta, solicitarUnion } from "@/app/(app)/sanes/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { CampoPin } from "@/components/campo-pin";
import { RUTA_VERIFICACION } from "@/lib/perfil-verificado";

/**
 * Confirma unirse/solicitar a un ahorro. Portero: si el perfil no está verificado
 * (KYC), muestra el disclaimer y el botón queda bloqueado. Si está verificado,
 * pide el PIN para confirmar. `modo` decide la acción: "unir" usa el id del san,
 * "solicitar" usa un código de invitación.
 */
export function ConfirmarUnion({
  codigo,
  verificado,
  modo,
  etiquetaBoton,
}: {
  codigo: string;
  verificado: boolean;
  modo: "unir" | "solicitar";
  etiquetaBoton: string;
}) {
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  if (!verificado) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
          <ShieldAlert className="size-4" /> Verifica tu perfil para unirte
        </p>
        <p className="text-muted-foreground">
          Para participar en un ahorro necesitas tener tu perfil verificado.
        </p>
        <Link
          href={RUTA_VERIFICACION}
          className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}
        >
          Completar verificación
        </Link>
      </div>
    );
  }

  if (ok) return <p className="text-sm font-medium text-brand">{ok}</p>;

  async function confirmar() {
    setEnviando(true);
    setError("");
    const res =
      modo === "solicitar"
        ? await solicitarUnion(codigo, pin)
        : await unirseARecolecta(codigo, pin);
    // Si une directo, la acción redirige; solo volvemos aquí con error u ok.
    if (res?.error) {
      setError(res.error);
      setEnviando(false);
    } else if (res?.ok) {
      setOk(res.ok);
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-center text-xs text-muted-foreground">
        Confirma con tu PIN de 6 dígitos
      </p>
      <CampoPin onChange={setPin} testId="union-pin" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        className="w-full"
        onClick={confirmar}
        disabled={enviando || !/^\d{6}$/.test(pin)}
      >
        <LogIn className="size-4" /> {enviando ? "Procesando..." : etiquetaBoton}
      </Button>
    </div>
  );
}
