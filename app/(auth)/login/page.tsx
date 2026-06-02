"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { iniciarSesion, type EstadoAuth } from "../actions";
import { SENAL_MIGRAR_PIN } from "../constants";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { BotonesWallet } from "@/components/botones-wallet";
import { CampoPin, type CampoPinHandle } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  // Paso actual del wizard: 1 = correo/usuario, 2 = PIN
  const [paso, setPaso] = useState<1 | 2>(1);

  // Identificador controlado para no perderlo entre pasos (React 19 resetea forms)
  const [identificador, setIdentificador] = useState("");

  // PIN: ref para que siempre sea el valor actual al enviar (sin stale closure),
  // y estado para controlar el disabled del botón.
  const pinRef = useRef<CampoPinHandle>(null);
  const pinActualRef = useRef("");
  const [pinLen, setPinLen] = useState(0);

  // Ref al form del paso 2 para auto-enviar al completar el PIN
  const formPinRef = useRef<HTMLFormElement>(null);

  // Centinela anti-doble-submit: se activa antes de enviar, se limpia tras recibir resultado
  const enviando = useRef(false);

  // Error local visible: permite limpiar el error al volver al paso 1
  const [errorLocal, setErrorLocal] = useState<string | undefined>(undefined);

  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    async (prevEstado, formData) => {
      const resultado = await iniciarSesion(prevEstado, formData);
      // Libera el centinela una vez que tenemos respuesta
      enviando.current = false;
      if (resultado?.error === SENAL_MIGRAR_PIN) {
        router.push(`/migrar-pin?u=${encodeURIComponent(identificador)}`);
        return {};
      }
      if (resultado?.error) {
        // Resetea el CampoPin para que el usuario pueda reintentar
        pinRef.current?.reset();
        pinActualRef.current = "";
        setPinLen(0);
        setErrorLocal(resultado.error);
      }
      return resultado ?? {};
    },
    {},
  );

  function handlePinChange(nuevoPin: string) {
    pinActualRef.current = nuevoPin;
    setPinLen(nuevoPin.length);
  }

  function avanzarPaso(e: React.FormEvent) {
    e.preventDefault();
    if (!identificador.trim()) return;
    setErrorLocal(undefined);
    setPaso(2);
  }

  function handlePinCompleto() {
    if (enviando.current) return;
    enviando.current = true;
    formPinRef.current?.requestSubmit();
  }

  return (
    <AuthShell
      variante="login"
      titulo={paso === 1 ? "Bienvenido de vuelta" : "Ingresa tu PIN"}
      subtitulo={
        paso === 1
          ? "Ingresa tus datos para continuar."
          : `PIN de 6 dígitos para ${identificador}`
      }
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
          ) : (
            <button
              type="button"
              aria-label="Volver al paso anterior"
              onClick={() => {
                setPaso(1);
                pinActualRef.current = "";
                setPinLen(0);
                pinRef.current?.reset();
                enviando.current = false;
                setErrorLocal(undefined);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
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
        {/* ── Paso 1: correo / usuario ── */}
        {paso === 1 && (
          <form onSubmit={avanzarPaso} className="space-y-4">
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
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                className={CAMPO_FILLED}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className={BOTON_DEGRADADO}
              disabled={!identificador.trim()}
            >
              Siguiente <ArrowRight className="ml-2 size-4" />
            </Button>
            <BotonesWallet accion="entrar" />
          </form>
        )}

        {/* ── Paso 2: PIN ── */}
        {paso === 2 && (
          <form
            ref={formPinRef}
            action={(fd) => {
              // Lee el PIN desde el ref (siempre actualizado, sin stale closure)
              fd.set("identificador", identificador);
              fd.set("pin", pinActualRef.current);
              return accion(fd);
            }}
            onSubmit={() => {
              // Bloquea doble submit desde el botón "Entrar" (distinto de handlePinCompleto)
              if (enviando.current) return;
              enviando.current = true;
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label className="block text-center text-xs text-muted-foreground">
                PIN de 6 dígitos
              </Label>
              <CampoPin
                ref={pinRef}
                onChange={handlePinChange}
                onCompleto={handlePinCompleto}
                autoFocus
                testId="login-pin"
              />
            </div>

            {errorLocal && (
              <p className="text-center text-sm text-destructive">
                {errorLocal}
              </p>
            )}

            <Button
              type="submit"
              className={BOTON_DEGRADADO}
              disabled={pendiente || pinLen < 6}
            >
              {pendiente ? "Entrando..." : "Entrar"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              ¿Olvidaste tu PIN?{" "}
              <span className="font-medium text-muted-foreground/60">
                Pronto
              </span>
            </p>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
