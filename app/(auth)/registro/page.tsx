"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { registrarse, type EstadoAuth } from "../actions";
import { registroPaso1Schema } from "@/lib/validations/auth";
import { PAISES } from "@/lib/paises";
import { CampoContrasena } from "@/components/campo-contrasena";
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
    <form action={accion} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          {paso === 1 ? "Crear cuenta" : "Cuéntanos de ti"}
        </h1>
        <p className="text-xs text-muted-foreground">Paso {paso} de 2</p>
      </div>

      <div className={paso === 1 ? "space-y-4" : "hidden"}>
        <div className="space-y-2">
          <Label htmlFor="correo">Correo</Label>
          <Input
            id="correo"
            name="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contrasena">Contraseña</Label>
          <CampoContrasena
            name="contrasena"
            value={contrasena}
            onChange={setContrasena}
            autoComplete="new-password"
            conGenerador
          />
          <p className="text-xs text-muted-foreground">
            Mínimo 8, con una mayúscula, un número y un símbolo.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirmar contraseña</Label>
          <CampoContrasena
            name="confirmar"
            value={confirmar}
            onChange={setConfirmar}
            autoComplete="new-password"
          />
        </div>
        {errorPaso1 && (
          <p className="text-sm text-destructive">{errorPaso1}</p>
        )}
        <Button type="button" className="w-full" onClick={continuar}>
          Continuar
        </Button>
      </div>

      <div className={paso === 2 ? "space-y-4" : "hidden"}>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombreUsuario" className="flex items-center gap-1.5">
            Nombre de usuario
            <span
              title="Tu nombre de usuario o seudónimo: así te verán las demás personas en la app."
              className="inline-flex cursor-help"
            >
              <Info className="size-3.5 text-muted-foreground" />
            </span>
          </Label>
          <Input
            id="nombreUsuario"
            name="nombreUsuario"
            placeholder="seudónimo con el que te verán"
            autoComplete="username"
          />
          <p className="text-xs text-muted-foreground">
            Es tu apodo público; puede ser tu nombre o un seudónimo.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pais">País</Label>
          <select
            id="pais"
            name="pais"
            defaultValue=""
            className="w-full rounded-md border bg-background p-2 text-sm"
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
          <Button type="button" variant="outline" onClick={() => setPaso(1)}>
            Atrás
          </Button>
          <Button type="submit" className="flex-1" disabled={pendiente}>
            {pendiente ? "Creando..." : "Crear cuenta"}
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-brand underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
