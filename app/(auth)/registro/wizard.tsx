"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Info, Fingerprint, Check, X } from "lucide-react";
import {
  solicitarRegistro,
  definirPinRegistro,
  completarRegistro,
  cancelarRegistro,
  type EstadoAuth,
} from "../actions";
import { PAISES } from "@/lib/paises";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { BotonesWallet } from "@/components/botones-wallet";
import { CampoPin, type CampoPinHandle } from "@/components/campo-pin";
import { CampoUsuario } from "@/components/campo-usuario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Paso = 1 | 2 | 3;

const TITULOS: Record<Paso, string> = {
  1: "Crea tu cuenta gratis",
  2: "Crea tu PIN (clave)",
  3: "Cuéntanos de ti",
};

const SUBTITULOS: Record<Paso, string> = {
  1: "Paso 1 de 3",
  2: "Paso 2 de 3",
  3: "Paso 3 de 3",
};

export function RegistroWizard({ pasoInicial }: { pasoInicial: Paso }) {
  const [paso, setPaso] = useState<Paso>(pasoInicial);

  // ── Paso 1: correo ──────────────────────────────────────────────────────
  const [estadoCorreo, accionCorreo, pendienteCorreo] = useActionState<
    EstadoAuth,
    FormData
  >(solicitarRegistro, {});

  // ── Paso 2: PIN ─────────────────────────────────────────────────────────
  const pinRef = useRef<CampoPinHandle>(null);
  const pinConfRef = useRef<CampoPinHandle>(null);
  const pinActualRef = useRef("");
  const pinConfActualRef = useRef("");
  const [pinLen, setPinLen] = useState(0);
  const [pinVal, setPinVal] = useState("");
  const [pinConfVal, setPinConfVal] = useState("");
  const [errorPinLocal, setErrorPinLocal] = useState<string | undefined>();
  const formPinRef = useRef<HTMLFormElement>(null);

  const [estadoPin, accionPin, pendientePin] = useActionState<
    EstadoAuth,
    FormData
  >(
    async (prev, fd) => {
      // Validación local: PINs deben coincidir
      if (pinActualRef.current !== pinConfActualRef.current) {
        setErrorPinLocal("Los PIN no coinciden.");
        pinConfRef.current?.reset();
        pinConfActualRef.current = "";
        return prev;
      }
      const resultado = await definirPinRegistro(prev, fd);
      if (resultado?.error) {
        setErrorPinLocal(resultado.error);
        pinRef.current?.reset();
        pinConfRef.current?.reset();
        pinActualRef.current = "";
        pinConfActualRef.current = "";
        setPinLen(0);
        return resultado;
      }
      // PIN guardado: avanzar al paso 3
      setErrorPinLocal(undefined);
      setPaso(3);
      return {};
    },
    {},
  );

  function handlePinChange(v: string) {
    pinActualRef.current = v;
    setPinLen(v.length);
    setPinVal(v);
  }

  function handlePinConfChange(v: string) {
    pinConfActualRef.current = v;
    setPinConfVal(v);
  }

  // ── Paso 3: datos ───────────────────────────────────────────────────────
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [estadoDatos, accionDatos, pendienteDatos] = useActionState<
    EstadoAuth,
    FormData
  >(completarRegistro, {});

  return (
    <AuthShell
      variante="registro"
      titulo={TITULOS[paso]}
      subtitulo={SUBTITULOS[paso]}
      header={
        <>
          {paso === 1 ? (
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : paso === 3 ? (
            <button
              type="button"
              aria-label="Volver al paso anterior"
              onClick={() => {
                setPaso(2);
                pinRef.current?.reset();
                pinConfRef.current?.reset();
                pinActualRef.current = "";
                pinConfActualRef.current = "";
                setPinLen(0);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            /* paso 2: el correo ya está verificado; no se puede volver al paso 1 */
            <div className="size-8" aria-hidden="true" />
          )}
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
        {/* ── Enlace "Empezar otro registro" (pasos 2 y 3) ── */}
        {paso > 1 && (
          <div className="text-center">
            <form
              action={cancelarRegistro}
              onSubmit={(e) => {
                if (!window.confirm("¿Seguro? Perderás el progreso guardado.")) {
                  e.preventDefault();
                }
              }}
            >
              <button
                type="submit"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Empezar otro registro
              </button>
            </form>
          </div>
        )}

        {/* ── Paso 1: correo ── */}
        {paso === 1 && (
          <form action={accionCorreo} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="correo" className="text-xs text-muted-foreground">
                Correo
              </Label>
              <Input
                id="correo"
                name="correo"
                type="email"
                autoComplete="email"
                autoFocus
                className={CAMPO_FILLED}
              />
            </div>
            {estadoCorreo.error && (
              <p className="text-sm text-destructive">{estadoCorreo.error}</p>
            )}
            <Button
              type="submit"
              className={BOTON_DEGRADADO}
              disabled={pendienteCorreo}
            >
              {pendienteCorreo ? "Enviando..." : "Siguiente"}
            </Button>
            <BotonesWallet accion="registrarte" />
          </form>
        )}

        {/* ── Paso 2: PIN ── */}
        {paso === 2 && (
          <form
            ref={formPinRef}
            action={(fd) => {
              fd.set("pin", pinActualRef.current);
              fd.set("confirmar", pinConfActualRef.current);
              return accionPin(fd);
            }}
            className="space-y-6"
          >
            {/* Descripción educativa */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
              <Fingerprint className="mx-auto mb-1.5 size-5 text-brand" />
              Tu PIN de 6 dígitos. Lo usarás cada vez que entres a tu cuenta.
            </div>

            <div className="space-y-3">
              <Label className="block text-center text-xs text-muted-foreground">
                Crea tu PIN
              </Label>
              <CampoPin
                ref={pinRef}
                onChange={handlePinChange}
                autoFocus
                testId="registro-pin"
              />
            </div>

            <div className="space-y-3">
              <Label className="block text-center text-xs text-muted-foreground">
                Confirma tu PIN
              </Label>
              <CampoPin
                ref={pinConfRef}
                onChange={handlePinConfChange}
                testId="registro-pin-conf"
              />
            </div>

            {/* Feedback de coincidencia en vivo */}
            {pinVal.length === 6 && pinConfVal.length === 6 && (
              pinVal === pinConfVal ? (
                <p className="flex items-center justify-center gap-1.5 text-center text-sm text-green-600">
                  <Check className="size-4" />
                  Las claves coinciden
                </p>
              ) : (
                <p className="flex items-center justify-center gap-1.5 text-center text-sm text-destructive">
                  <X className="size-4" />
                  No coinciden
                </p>
              )
            )}

            {(errorPinLocal ?? estadoPin.error) && (
              <p className="text-center text-sm text-destructive">
                {errorPinLocal ?? estadoPin.error}
              </p>
            )}

            <Button
              type="submit"
              className={BOTON_DEGRADADO}
              disabled={pendientePin || pinLen < 6 || (pinVal.length === 6 && pinConfVal.length === 6 && pinVal !== pinConfVal)}
            >
              {pendientePin ? "Guardando..." : "Continuar"}
            </Button>
          </form>
        )}

        {/* ── Paso 3: datos ── */}
        {paso === 3 && (
          <form action={accionDatos} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="nombre"
                  className="text-xs text-muted-foreground"
                >
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
                <Input
                  id="apellido"
                  name="apellido"
                  className={CAMPO_FILLED}
                />
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
            {estadoDatos.error && (
              <p className="text-sm text-destructive">{estadoDatos.error}</p>
            )}
            <Button
              type="submit"
              className={BOTON_DEGRADADO}
              disabled={pendienteDatos}
            >
              {pendienteDatos ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
