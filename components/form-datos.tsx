"use client";

import { useActionState, useState } from "react";
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
  nombre: n0,
  apellido: a0,
  nombreUsuario: u0,
}: {
  correo: string;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
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
      <div className="space-y-1">
        <Label>Correo</Label>
        <Input value={correo} disabled />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            name="apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>
      </div>
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
