"use client";

import { useActionState, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Fingerprint, Check, X } from "lucide-react";
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
  const [pinVal, setPinVal] = useState("");

  // PIN de confirmación
  const pinConfRef = useRef<CampoPinHandle>(null);
  const pinConfActualRef = useRef("");
  const [pinConfVal, setPinConfVal] = useState("");

  // Error local (coincidencia de PINs)
  const [errorLocal, setErrorLocal] = useState<string | undefined>(undefined);

  const [estado, accion, pendiente] = useActionState<EstadoAuth, FormData>(
    async (prev, fd) => {
      // Validación local: los PINs deben coincidir
      if (pinActualRef.current !== pinConfActualRef.current) {
        setErrorLocal("Los PIN no coinciden.");
        pinConfRef.current?.reset();
        pinConfActualRef.current = "";
        setPinConfVal("");
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
        setPinVal("");
        setPinConfVal("");
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
                setPinVal(v);
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
                setPinConfVal(v);
              }}
              testId="migrar-pin-conf"
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

          {errorMostrar && (
            <p className="text-center text-sm text-destructive" data-testid="migrar-error">
              {errorMostrar}
            </p>
          )}

          <Button
            type="submit"
            className={BOTON_DEGRADADO}
            disabled={pendiente || pinLen < 6 || (pinVal.length === 6 && pinConfVal.length === 6 && pinVal !== pinConfVal)}
          >
            {pendiente ? "Guardando..." : "Crear PIN y entrar"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
