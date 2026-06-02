"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  Fingerprint,
  ShieldCheck,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
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
import { CampoPin, type CampoPinHandle } from "@/components/campo-pin";

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
  tieneContrasena,
}: {
  pinActivo: boolean;
  otpActivo: boolean;
  tieneContrasena: boolean;
}) {
  const [exp, setExp] = useState<null | "pin" | "password">(null);
  const [otp, setOtp] = useState(otpActivo);
  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdConfirmar, setPwdConfirmar] = useState("");
  const [errPwd, setErrPwd] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);

  // PIN form state (managed manually because CampoPin is uncontrolled)
  const [pinActualVal, setPinActualVal] = useState("");
  const [pinNuevoVal, setPinNuevoVal] = useState("");
  const [pinConfVal, setPinConfVal] = useState("");
  const pinActualRef = useRef<CampoPinHandle>(null);
  const pinNuevoRef = useRef<CampoPinHandle>(null);
  const pinConfRef = useRef<CampoPinHandle>(null);
  const [isPinPending, startPinTransition] = useTransition();

  // "quitar PIN" form state
  const [claveQuitar, setClaveQuitar] = useState("");
  const [estQ, accQ, pendQ] = useActionState<EstadoSeguridad, FormData>(
    quitarPin,
    {},
  );
  useToastSeguridad(estQ, "PIN eliminado", () => {
    setExp(null);
    setClaveQuitar("");
  });

  const [estDef, setEstDef] = useState<EstadoSeguridad>({});
  useToastSeguridad(estDef, "PIN configurado", () => {
    setExp(null);
    pinActualRef.current?.reset();
    pinNuevoRef.current?.reset();
    pinConfRef.current?.reset();
    setPinActualVal("");
    setPinNuevoVal("");
    setPinConfVal("");
  });

  const [estPwd, accPwd, pendPwd] = useActionState<EstadoSeguridad, FormData>(
    cambiarContrasena,
    {},
  );
  useToastSeguridad(estPwd, "Contraseña cambiada", () => setExp(null));
  const previoPwd = useRef<EstadoSeguridad>(estPwd);
  useEffect(() => {
    if (estPwd === previoPwd.current) return;
    previoPwd.current = estPwd;
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

  function handleSubmitPin(e: React.FormEvent) {
    e.preventDefault();
    startPinTransition(async () => {
      const fd = new FormData();
      if (pinActivo) {
        fd.set("pinActual", pinActualVal);
      } else if (tieneContrasena) {
        // No tiene PIN pero sí contraseña: pedir contraseña como fallback
        const claveInput = (e.target as HTMLFormElement).elements.namedItem(
          "clave",
        ) as HTMLInputElement | null;
        fd.set("clave", claveInput?.value ?? "");
      }
      fd.set("pin", pinNuevoVal);
      fd.set("pin2", pinConfVal);
      const r = await definirPin({}, fd);
      setEstDef(r);
    });
  }

  const check = <CheckCircle2 className="size-5 text-brand" />;

  return (
    <section className="space-y-3">
      {/* ── Acceso ── */}
      <div>
        <h2 className="text-sm font-semibold">Acceso a la cuenta</h2>
        <p className="text-xs text-muted-foreground">
          Tu PIN de 6 dígitos es la credencial con la que entras a Green Sol.
        </p>
      </div>

      {/* PIN — credencial de acceso */}
      <div className="rounded-2xl border bg-card">
        <button
          type="button"
          onClick={() => setExp(exp === "pin" ? null : "pin")}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <KeyRound className="size-5 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium">PIN de acceso</p>
            <p className="text-xs text-muted-foreground">
              {pinActivo
                ? "Tu PIN actual está activo. Cámbialo si lo necesitas."
                : "Define tu PIN para poder entrar a la app."}
            </p>
          </div>
          {pinActivo ? (
            check
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </button>

        {exp === "pin" && (
          <div className="border-t p-4 space-y-4">
            {/* Cambiar / Definir PIN */}
            <form onSubmit={handleSubmitPin} className="space-y-3">
              {/* PIN actual — solo si ya tiene PIN */}
              {pinActivo && (
                <div className="space-y-1">
                  <Label>PIN actual (6 dígitos)</Label>
                  <CampoPin
                    ref={pinActualRef}
                    onChange={setPinActualVal}
                    testId="cfg-pin-actual"
                  />
                </div>
              )}
              {/* Fallback: sin PIN pero con contraseña */}
              {!pinActivo && tieneContrasena && (
                <div className="space-y-1">
                  <Label htmlFor="clave-def">Tu contraseña (para confirmar)</Label>
                  <Input id="clave-def" name="clave" type="password" />
                </div>
              )}
              <div className="space-y-1">
                <Label>Nuevo PIN (6 dígitos)</Label>
                <CampoPin
                  ref={pinNuevoRef}
                  onChange={setPinNuevoVal}
                  testId="cfg-pin-nuevo"
                />
              </div>
              <div className="space-y-1">
                <Label>Repetir nuevo PIN</Label>
                <CampoPin
                  ref={pinConfRef}
                  onChange={setPinConfVal}
                  testId="cfg-pin-conf"
                />
              </div>
              <Button
                type="submit"
                disabled={isPinPending}
                className="bg-brand text-white hover:bg-brand/90"
              >
                {isPinPending
                  ? "Guardando..."
                  : pinActivo
                    ? "Cambiar PIN"
                    : "Guardar PIN"}
              </Button>
            </form>

            {/* Quitar PIN — solo si tiene contraseña (para no dejar sin credencial) */}
            {pinActivo && (
              <>
                <hr className="border-border" />
                {tieneContrasena ? (
                  <form action={accQ} className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Al quitar el PIN podrás volver a definir uno cuando quieras.
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="clave-q">Contraseña para confirmar</Label>
                      <Input
                        id="clave-q"
                        name="clave"
                        type="password"
                        value={claveQuitar}
                        onChange={(e) => setClaveQuitar(e.target.value)}
                      />
                    </div>
                    <Button type="submit" variant="destructive" disabled={pendQ}>
                      {pendQ ? "Quitando..." : "Quitar PIN"}
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      No puedes quitar tu PIN: es tu única forma de iniciar sesión. Para quitarlo, primero configura una contraseña en la sección "Factor fuerte".
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Verificación de acciones ── */}
      <div className="pt-1">
        <h2 className="text-sm font-semibold">Verificación de acciones</h2>
        <p className="text-xs text-muted-foreground">
          Métodos extra que pueden pedirse al confirmar acciones sensibles.
        </p>
      </div>

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
            Código de un solo uso enviado a tu correo al confirmar acciones importantes.
          </p>
        </div>
        {otp ? check : <span className="text-xs text-muted-foreground">Activar</span>}
      </button>

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

      {/* ── Factor fuerte para cripto ── */}
      <div className="pt-1">
        <h2 className="text-sm font-semibold">Factor fuerte</h2>
        <p className="text-xs text-muted-foreground">
          La contraseña se reserva para operaciones de alto valor (como retiros cripto). No se usa para entrar.
        </p>
      </div>

      {/* Contraseña — factor fuerte (se pide la actual para cambiar) */}
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
              Factor de seguridad adicional para operaciones cripto.
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
        {exp === "password" && (
          <div className="border-t p-4">
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
                  Mínimo 8 caracteres, con una mayúscula, un número y un símbolo.
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
          </div>
        )}
      </div>
    </section>
  );
}
