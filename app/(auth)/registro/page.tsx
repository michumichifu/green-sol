"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { registrarse, type EstadoAuth } from "../actions";
import { registroPaso1Schema } from "@/lib/validations/auth";
import { PAISES } from "@/lib/paises";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { BotonesWallet } from "@/components/botones-wallet";
import { CampoContrasena } from "@/components/campo-contrasena";
import { FuerzaContrasena } from "@/components/fuerza-contrasena";
import { CampoUsuario } from "@/components/campo-usuario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistroPage() {
  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    registrarse,
    {},
  );
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [errorPaso1, setErrorPaso1] = useState<string | null>(null);

  function continuar() {
    const r = registroPaso1Schema.safeParse({ correo, contrasena, confirmar });
    if (!r.success) {
      setErrorPaso1(r.error.issues[0].message);
      return;
    }
    setErrorPaso1(null);
    setPaso(2);
  }

  return (
    <AuthShell
      variante="registro"
      titulo={paso === 1 ? "Crea tu cuenta gratis" : "Cuéntanos de ti"}
      subtitulo={`Paso ${paso} de 2`}
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
            ¿Ya tienes cuenta?
            <Link
              href="/login"
              className="rounded-full bg-white/20 px-3 py-1 font-medium transition-colors hover:bg-white/30"
            >
              Entrar
            </Link>
          </span>
        </>
      }
    >
      <div className="space-y-5">
        <form action={accion} className="space-y-4">
          <div className={paso === 1 ? "space-y-4" : "hidden"}>
            <div className="space-y-1.5">
              <Label htmlFor="correo" className="text-xs text-muted-foreground">
                Correo
              </Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
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
                autoComplete="new-password"
                conGenerador
                inputClassName={CAMPO_FILLED}
              />
              <FuerzaContrasena value={contrasena} />
              <p className="text-xs text-muted-foreground">
                Mínimo 8, con una mayúscula, un número y un símbolo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmar"
                className="text-xs text-muted-foreground"
              >
                Confirmar contraseña
              </Label>
              <CampoContrasena
                name="confirmar"
                value={confirmar}
                onChange={setConfirmar}
                autoComplete="new-password"
                inputClassName={CAMPO_FILLED}
              />
            </div>
            {errorPaso1 && (
              <p className="text-sm text-destructive">{errorPaso1}</p>
            )}
            <Button type="button" className={BOTON_DEGRADADO} onClick={continuar}>
              Continuar
            </Button>
          </div>

          <div className={paso === 2 ? "space-y-4" : "hidden"}>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-xs text-muted-foreground">
                  Nombre
                </Label>
                <Input id="nombre" name="nombre" className={CAMPO_FILLED} />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="apellido"
                  className="text-xs text-muted-foreground"
                >
                  Apellido
                </Label>
                <Input id="apellido" name="apellido" className={CAMPO_FILLED} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="nombreUsuario"
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                Nombre de usuario
                <span
                  title="Tu nombre de usuario o seudónimo: así te verán las demás personas en la app."
                  className="inline-flex cursor-help"
                >
                  <Info className="size-3.5" />
                </span>
              </Label>
              <CampoUsuario
                id="nombreUsuario"
                name="nombreUsuario"
                value={nombreUsuario}
                onChange={setNombreUsuario}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pais" className="text-xs text-muted-foreground">
                País
              </Label>
              <select
                id="pais"
                name="pais"
                defaultValue=""
                className={`${CAMPO_FILLED} w-full`}
              >
                <option value="" disabled>
                  Elige tu país
                </option>
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            {estado.error && (
              <p className="text-sm text-destructive">{estado.error}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setPaso(1)}
              >
                Atrás
              </Button>
              <Button
                type="submit"
                className={`${BOTON_DEGRADADO} flex-1`}
                disabled={pendiente}
              >
                {pendiente ? "Creando..." : "Crear cuenta"}
              </Button>
            </div>
          </div>
        </form>
        {paso === 1 && <BotonesWallet accion="registrarte" />}
      </div>
    </AuthShell>
  );
}
