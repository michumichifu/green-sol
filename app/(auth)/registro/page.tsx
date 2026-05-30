"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registrarse, type EstadoAuth } from "../actions";
import { generarContrasena } from "@/lib/auth/generar-contrasena";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    registrarse,
    {},
  );
  const [contrasena, setContrasena] = useState("");
  const [mostrar, setMostrar] = useState(false);

  return (
    <form action={accion} className="space-y-4">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <div className="space-y-2">
        <Label htmlFor="correo">Correo</Label>
        <Input id="correo" name="correo" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrasena">Contraseña</Label>
        <Input
          id="contrasena"
          name="contrasena"
          type={mostrar ? "text" : "password"}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          required
          autoComplete="new-password"
        />
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-muted-foreground underline"
            onClick={() => setMostrar((m) => !m)}
          >
            {mostrar ? "Ocultar" : "Mostrar"}
          </button>
          <button
            type="button"
            className="text-brand underline"
            onClick={() => {
              setContrasena(generarContrasena());
              setMostrar(true);
            }}
          >
            Generar contraseña
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con una mayúscula, un número y un símbolo.
        </p>
      </div>
      {estado.error && (
        <p className="text-sm text-destructive">{estado.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pendiente}>
        {pendiente ? "Creando..." : "Crear cuenta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
