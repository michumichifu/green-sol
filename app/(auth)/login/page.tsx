"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { iniciarSesion, type EstadoAuth } from "../actions";
import { CampoContrasena } from "@/components/campo-contrasena";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    iniciarSesion,
    {},
  );
  const [contrasena, setContrasena] = useState("");

  return (
    <form action={accion} className="space-y-4">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <div className="space-y-2">
        <Label htmlFor="identificador">Correo o usuario</Label>
        <Input
          id="identificador"
          name="identificador"
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrasena">Contraseña</Label>
        <CampoContrasena
          name="contrasena"
          value={contrasena}
          onChange={setContrasena}
          autoComplete="current-password"
        />
      </div>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-brand underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
