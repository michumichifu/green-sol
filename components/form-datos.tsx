"use client";

import { useActionState, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  actualizarPerfil,
  type EstadoPerfil,
} from "@/app/(app)/perfil/actions";
import { CampoUsuario } from "@/components/campo-usuario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormDatos({
  correo,
  walletAddress,
  nombre: n0,
  apellido: a0,
  nombreUsuario: u0,
  kycAprobado = false,
}: {
  correo: string | null;
  walletAddress?: string | null;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  kycAprobado?: boolean;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoPerfil, FormData>(
    actualizarPerfil,
    {},
  );
  const [nombre, setNombre] = useState(n0);
  const [apellido, setApellido] = useState(a0);
  const [nombreUsuario, setNombreUsuario] = useState(u0);

  return (
    <form action={accion} className="space-y-3">
      {correo ? (
        <div className="space-y-1">
          <Label>Correo</Label>
          <Input value={correo} disabled />
        </div>
      ) : walletAddress ? (
        <div className="space-y-1">
          <Label>Wallet</Label>
          <Input
            value={`${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Tu cuenta usa tu wallet de Solana. El correo es opcional.
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={kycAprobado}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            name="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            disabled={kycAprobado}
          />
        </div>
      </div>
      {kycAprobado && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-brand" />
          Nombre y apellido quedaron fijos al verificar tu identidad (KYC).
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="nombreUsuario">Nombre de usuario</Label>
        <CampoUsuario
          id="nombreUsuario"
          name="nombreUsuario"
          value={nombreUsuario}
          onChange={setNombreUsuario}
        />
      </div>
      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-brand">Datos guardados.</p>}
      <Button type="submit" variant="outline" disabled={pendiente}>
        {pendiente ? "Guardando..." : "Guardar datos"}
      </Button>
    </form>
  );
}
