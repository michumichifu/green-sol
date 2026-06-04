"use client";

import { useActionState } from "react";
import { invitarUsuario } from "@/app/(app)/sanes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Estado = { error?: string; ok?: string };

/** Invita a un usuario por correo o @usuario (invitación nominal: entra directo). */
export function InvitarUsuario({ recolectaId }: { recolectaId: string }) {
  const [estado, formAction, pendiente] = useActionState<Estado, FormData>(
    async (_prev, fd) => invitarUsuario(recolectaId, fd),
    {},
  );

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="identificador"
          placeholder="Correo o @usuario"
          autoComplete="off"
          required
        />
        <Button type="submit" variant="outline" disabled={pendiente}>
          {pendiente ? "..." : "Invitar"}
        </Button>
      </div>
      {estado?.error && <p className="text-xs text-destructive">{estado.error}</p>}
      {estado?.ok && <p className="text-xs text-brand">{estado.ok}</p>}
    </form>
  );
}
