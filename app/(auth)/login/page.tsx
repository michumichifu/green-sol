"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { iniciarSesion, type EstadoAuth } from "../actions";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { BotonesWallet } from "@/components/botones-wallet";
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
    <AuthShell
      variante="login"
      titulo="Bienvenido de vuelta"
      subtitulo="Ingresa tus datos para continuar."
      header={
        <>
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="flex items-center gap-2 text-white/90">
            ¿No tienes cuenta?
            <Link
              href="/registro"
              className="rounded-full bg-white/20 px-3 py-1 font-medium transition-colors hover:bg-white/30"
            >
              Empezar
            </Link>
          </span>
        </>
      }
    >
      <div className="space-y-5">
        <form action={accion} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="identificador"
              className="text-xs text-muted-foreground"
            >
              Correo o usuario
            </Label>
            <Input
              id="identificador"
              name="identificador"
              autoComplete="username"
              className={CAMPO_FILLED}
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="contrasena"
              className="text-xs text-muted-foreground"
            >
              Contraseña
            </Label>
            <CampoContrasena
              name="contrasena"
              value={contrasena}
              onChange={setContrasena}
              autoComplete="current-password"
              inputClassName={CAMPO_FILLED}
            />
          </div>
          {estado.error && (
            <p className="text-sm text-destructive">{estado.error}</p>
          )}
          <Button type="submit" className={BOTON_DEGRADADO} disabled={pendiente}>
            {pendiente ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <BotonesWallet accion="entrar" />
      </div>
    </AuthShell>
  );
}
