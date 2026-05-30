"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type EstadoAuth } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    iniciarSesion,
    {},
  );

  return (
    <form action={accion} className="space-y-4">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <div className="space-y-2">
        <Label htmlFor="correo">Correo</Label>
        <Input id="correo" name="correo" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrasena">Contraseña</Label>
        <Input
          id="contrasena"
          name="contrasena"
          type="password"
          required
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
