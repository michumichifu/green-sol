"use client";

import { useActionState, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { crearPinMigracion, type EstadoAuth } from "../actions";
import {
  AuthShell,
  CAMPO_FILLED,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { CampoPin, type CampoPinHandle } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MigrarPinPage() {
  const params = useSearchParams();
  const identificador = params.get("u") ?? "";

  // PIN principal
  const pinRef = useRef<CampoPinHandle>(null);
  const pinActualRef = useRef("");
  const [pinLen, setPinLen] = useState(0);

  // PIN de confirmación
  const pinConfRef = useRef<CampoPinHandle>(null);
  const pinConfActualRef = useRef("");

  // Error local (coincidencia de PINs)
  const [errorLocal, setErrorLocal] = useState<string | undefined>(undefined);

  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    async (prev, fd) => {
      // Validación local: los PINs deben coincidir
      if (pinActualRef.current !== pinConfActualRef.current) {
        setErrorLocal("Los PIN no coinciden.");
        pinConfRef.current?.reset();
        pinConfActualRef.current = "";
        return prev;
      }
      const resultado = await crearPinMigracion(prev, fd);
      if (resultado?.error) {
        setErrorLocal(resultado.error);
        pinRef.current?.reset();
        pinConfRef.current?.reset();
        pinActualRef.current = "";
        pinConfActualRef.current = "";
        setPinLen(0);
      }
      return resultado ?? {};
    },
    {},
  );

  const errorMostrar = errorLocal ?? estado.error;

  return (
    <AuthShell
      variante="login"
      titulo="Crea tu PIN"
      subtitulo="Desde ahora entrarás con un PIN de 6 dígitos. Solo tarda un momento."
      header={
        <>
          <Link
            href="/login"
            aria-label="Volver al inicio de sesión"
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="text-sm text-white/80">
            Migración de seguridad
          </span>
        </>
      }
    >
      <div className="space-y-5">
        {/* Descripción educativa */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
          <Fingerprint className="mx-auto mb-1.5 size-5 text-brand" />
          Confirmamos tu identidad con tu contraseña actual
          <br />
          y luego creas tu PIN personal para entrar cada vez.
        </div>

        <form
          action={(fd) => {
            fd.set("identificador", identificador);
            fd.set("pin", pinActualRef.current);
            fd.set("confirmar", pinConfActualRef.current);
            setErrorLocal(undefined);
            return accion(fd);
          }}
          className="space-y-5"
        >
          {/* Identificador de solo lectura (sin seguridad: la acción verifica la contraseña) */}
          <input type="hidden" name="identificador" value={identificador} />

          {identificador && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Cuenta
              </Label>
              <div
                className={`${CAMPO_FILLED} flex h-12 items-center rounded-xl px-4 text-sm text-muted-foreground`}
              >
                {identificador}
              </div>
            </div>
          )}

          {/* Contraseña actual */}
          <div className="space-y-1.5">
            <Label
              htmlFor="contrasena"
              className="text-xs text-muted-foreground"
            >
              Contraseña actual
            </Label>
            <Input
              id="contrasena"
              name="contrasena"
              type="password"
              autoComplete="current-password"
              autoFocus
              className={CAMPO_FILLED}
              data-testid="migrar-contrasena"
            />
          </div>

          {/* PIN nuevo */}
          <div className="space-y-3">
            <Label className="block text-center text-xs text-muted-foreground">
              Elige tu PIN de 6 dígitos
            </Label>
            <CampoPin
              ref={pinRef}
              onChange={(v) => {
                pinActualRef.current = v;
                setPinLen(v.length);
              }}
              testId="migrar-pin"
            />
          </div>

          {/* Confirmación del PIN */}
          <div className="space-y-3">
            <Label className="block text-center text-xs text-muted-foreground">
              Confirma tu PIN
            </Label>
            <CampoPin
              ref={pinConfRef}
              onChange={(v) => {
                pinConfActualRef.current = v;
              }}
              testId="migrar-pin-conf"
            />
          </div>

          {errorMostrar && (
            <p className="text-center text-sm text-destructive" data-testid="migrar-error">
              {errorMostrar}
            </p>
          )}

          <Button
            type="submit"
            className={BOTON_DEGRADADO}
            disabled={pendiente || pinLen < 6}
          >
            {pendiente ? "Guardando..." : "Crear PIN y entrar"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
