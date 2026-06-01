"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verificar, reenviarCodigo, type EstadoAuth } from "../actions";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerificarPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    verificar,
    {},
  );

  return (
    <AuthShell
      variante="login"
      titulo="Verifica tu correo"
      subtitulo="Te enviamos un código de 6 dígitos."
      header={
        <Link
          href="/login"
          aria-label="Volver"
          className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="size-4" />
        </Link>
      }
    >
      <form action={accion} className="space-y-4">
        <p className="text-center text-xs text-muted-foreground">
          En desarrollo, el código aparece en la consola del servidor.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="codigo" className="text-xs text-muted-foreground">
            Código
          </Label>
          <Input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            maxLength={6}
            required
            placeholder="000000"
            className={`${CAMPO_FILLED} text-center text-lg tracking-[0.5em]`}
          />
        </div>
        {estado.error && (
          <p className="text-sm text-destructive">{estado.error}</p>
        )}
        <Button type="submit" className={BOTON_DEGRADADO} disabled={pendiente}>
          {pendiente ? "Verificando..." : "Verificar"}
        </Button>
        <Button
          type="submit"
          variant="ghost"
          className="h-10 w-full"
          formAction={reenviarCodigo}
          formNoValidate
        >
          Reenviar código
        </Button>
      </form>
    </AuthShell>
  );
}
