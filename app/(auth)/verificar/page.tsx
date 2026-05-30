"use client";

import { useActionState } from "react";
import { verificar, reenviarCodigo, type EstadoAuth } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerificarPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    verificar,
    {},
  );

  return (
    <form action={accion} className="space-y-4">
      <h1 className="text-2xl font-bold">Verifica tu correo</h1>
      <p className="text-sm text-muted-foreground">
        Te enviamos un código de 6 dígitos. (En desarrollo aparece en la consola
        del servidor.)
      </p>
      <div className="space-y-2">
        <Label htmlFor="codigo">Código</Label>
        <Input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="000000"
        />
      </div>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Verificando..." : "Verificar"}
      </Button>
      <Button
        type="submit"
        variant="ghost"
        className="w-full"
        formAction={reenviarCodigo}
        formNoValidate
      >
        Reenviar código
      </Button>
    </form>
  );
}
