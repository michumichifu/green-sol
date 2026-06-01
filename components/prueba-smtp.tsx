"use client";

import { useActionState } from "react";
import {
  enviarCorreoPrueba,
  type EstadoPruebaSmtp,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PruebaSmtp({ correoDefault }: { correoDefault?: string }) {
  const [estado, accion, pendiente] = useActionState<EstadoPruebaSmtp, FormData>(
    enviarCorreoPrueba,
    {},
  );

  return (
    <form action={accion} className="space-y-2 rounded-xl border bg-card p-3">
      <Label htmlFor="destino">Enviar correo de prueba a</Label>
      <div className="flex gap-2">
        <Input
          id="destino"
          name="destino"
          type="email"
          placeholder="tu@correo.com"
          defaultValue={correoDefault}
        />
        <Button type="submit" variant="outline" disabled={pendiente}>
          {pendiente ? "Enviando..." : "Enviar prueba"}
        </Button>
      </div>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      {estado.ok && (
        <p className="text-sm text-brand">{estado.mensaje ?? "Enviado."}</p>
      )}
    </form>
  );
}
