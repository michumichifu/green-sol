"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Fingerprint,
  ShieldCheck,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  definirPin,
  quitarPin,
  alternarOtpCorreo,
  cambiarContrasena,
  type EstadoSeguridad,
} from "@/app/(app)/configuracion/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function useToastSeguridad(
  estado: EstadoSeguridad,
  msgOk: string,
  onOk?: () => void,
) {
  const previo = useRef<EstadoSeguridad>(estado);
  useEffect(() => {
    if (estado === previo.current) return;
    previo.current = estado;
    if (estado.ok) {
      toast.success(msgOk);
      onOk?.();
    } else if (estado.error) {
      toast.error(estado.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);
}

/** Tarjeta de un método aún no disponible (biometría, authenticator, contraseña). */
function TarjetaPronto({
  Icono,
  nombre,
  sub,
  badge,
}: {
  Icono: typeof Fingerprint;
  nombre: string;
  sub: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 opacity-70">
      <Icono className="size-5 text-brand" />
      <div className="flex-1">
        <p className="text-sm font-medium">{nombre}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {badge && (
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium text-gold">
          {badge}
        </span>
      )}
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        Pronto
      </span>
    </div>
  );
}

export function FormSeguridad({
  pinActivo,
  otpActivo,
}: {
  pinActivo: boolean;
  otpActivo: boolean;
}) {
  const [exp, setExp] = useState<null | "pin" | "password">(null);
  const [otp, setOtp] = useState(otpActivo);
  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [errPwd, setErrPwd] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);

  const [estDef, accDef, pendDef] = useActionState<EstadoSeguridad, FormData>(
    definirPin,
    {},
  );
  useToastSeguridad(estDef, "PIN configurado", () => setExp(null));
  const [estQ, accQ, pendQ] = useActionState<EstadoSeguridad, FormData>(
    quitarPin,
    {},
  );
  useToastSeguridad(estQ, "PIN eliminado", () => setExp(null));
  const [estPwd, accPwd, pendPwd] = useActionState<EstadoSeguridad, FormData>(
    cambiarContrasena,
    {},
  );
  useToastSeguridad(estPwd, "Contraseña cambiada", () => setExp(null));
  const previoPwd = useRef<EstadoSeguridad>(estPwd);
  useEffect(() => {
    if (estPwd === previoPwd.current) return;
    previoPwd.current = estPwd;
    // En éxito o error se limpian los campos; en error, se marca rojo y vibra.
    setPwdActual("");
    setPwdNueva("");
    setPwdConfirmar("");
    if (estPwd.error) {
      setErrPwd(true);
      setShakeTick((t) => t + 1);
    } else {
      setErrPwd(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estPwd]);

  async function toggleOtp(v: boolean) {
    setOtp(v);
    const r = await alternarOtpCorreo(v);
    if (!r.ok) {
      setOtp(!v);
      toast.error(r.error ?? "No se pudo cambiar.");
    } else {
      toast.success(
        v ? "Código por correo activado" : "Código por correo desactivado",
      );
    }
  }

  const activos = [pinActivo, otp].filter(Boolean).length;
  const check = <CheckCircle2 className="size-5 text-brand" />;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">
          Autenticación de dos factores (2FA)
        </h2>
        <p className="text-xs text-muted-foreground">
          Para proteger tu cuenta, te recomendamos activar al menos 2 métodos de
          2FA.{activos >= 2 ? " ✓ Bien protegida." : ""}
        </p>
      </div>

      <TarjetaPronto
        Icono={Fingerprint}
        nombre="Llave de acceso (biometría)"
        sub="Huella o Face ID, sin escribir nada."
        badge="Recomendado"
      />
      <TarjetaPronto
        Icono={ShieldCheck}
        nombre="App de autenticador"
        sub="Google Authenticator u otra (TOTP)."
      />

      {/* Email / OTP — funcional */}
      <button
        type="button"
        onClick={() => toggleOtp(!otp)}
        className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left"
      >
        <Mail className="size-5 text-brand" />
        <div className="flex-1">
          <p className="text-sm font-medium">Código por correo</p>
          <p className="text-xs text-muted-foreground">
            Código de un solo uso enviado a tu correo.
          </p>
        </div>
        {otp ? check : <span className="text-xs text-muted-foreground">Activar</span>}
      </button>

      {/* PIN — funcional */}
      <div className="rounded-2xl border bg-card">
        <button
          type="button"
          onClick={() => setExp(exp === "pin" ? null : "pin")}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <KeyRound className="size-5 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium">PIN</p>
            <p className="text-xs text-muted-foreground">
              Código corto de 4 a 6 dígitos.
            </p>
          </div>
          {pinActivo ? (
            check
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>

        {exp === "pin" && (
          <div className="border-t p-4">
            {pinActivo ? (
              <form action={accQ} className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="clave-q">Confirma con tu contraseña</Label>
                  <Input id="clave-q" name="clave" type="password" />
                </div>
                <Button type="submit" variant="destructive" disabled={pendQ}>
                  {pendQ ? "Quitando..." : "Quitar PIN"}
                </Button>
              </form>
            ) : (
              <form action={accDef} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="pin">PIN (4–6 dígitos)</Label>
                    <Input
                      id="pin"
                      name="pin"
                      inputMode="numeric"
                      maxLength={6}
                      type="password"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pin2">Repetir PIN</Label>
                    <Input
                      id="pin2"
                      name="pin2"
                      inputMode="numeric"
                      maxLength={6}
                      type="password"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clave-def">Tu contraseña</Label>
                  <Input id="clave-def" name="clave" type="password" />
                </div>
                <Button
                  type="submit"
                  disabled={pendDef}
                  className="bg-brand text-white hover:bg-brand/90"
                >
                  {pendDef ? "Guardando..." : "Activar PIN"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Contraseña — funcional (requiere al menos un método de 2FA) */}
      <div className="rounded-2xl border bg-card">
        <button
          type="button"
          onClick={() => setExp(exp === "password" ? null : "password")}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <Lock className="size-5 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium">Contraseña</p>
            <p className="text-xs text-muted-foreground">
              Cambia tu contraseña de la cuenta.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        {exp === "password" && (
          <div className="border-t p-4">
            {activos === 0 ? (
              <p className="text-xs text-muted-foreground">
                Para cambiar tu contraseña, primero agrega un método de 2FA (PIN
                o código por correo) arriba. Es una protección extra de tu
                cuenta.
              </p>
            ) : (
              <form
                key={shakeTick}
                action={accPwd}
                className={`space-y-2 ${errPwd ? "animate-shake" : ""}`}
              >
                <div className="space-y-1">
                  <Label htmlFor="pwd-actual">Contraseña actual</Label>
                  <Input
                    id="pwd-actual"
                    name="actual"
                    type="password"
                    value={pwdActual}
                    onChange={(e) => {
                      setPwdActual(e.target.value);
                      setErrPwd(false);
                    }}
                    aria-invalid={errPwd}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pwd-nueva">Nueva contraseña</Label>
                  <Input
                    id="pwd-nueva"
                    name="nueva"
                    type="password"
                    value={pwdNueva}
                    onChange={(e) => {
                      setPwdNueva(e.target.value);
                      setErrPwd(false);
                    }}
                    aria-invalid={errPwd}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8, con una mayúscula, un número y un símbolo.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pwd-confirmar">
                    Confirmar nueva contraseña
                  </Label>
                  <Input
                    id="pwd-confirmar"
                    name="confirmar"
                    type="password"
                    value={pwdConfirmar}
                    onChange={(e) => {
                      setPwdConfirmar(e.target.value);
                      setErrPwd(false);
                    }}
                    aria-invalid={errPwd}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={pendPwd}
                  className={
                    errPwd
                      ? "bg-destructive text-white hover:bg-destructive/90"
                      : "bg-brand text-white hover:bg-brand/90"
                  }
                >
                  {pendPwd ? "Guardando..." : "Cambiar contraseña"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
