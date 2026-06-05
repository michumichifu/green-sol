"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useWalletConnection } from "@solana/react-hooks";
import { toast } from "sonner";
import bs58 from "bs58";
import { Wallet, ShieldCheck } from "lucide-react";
import {
  generarNonceWallet,
  loginConWallet,
  iniciarRegistroWallet,
  completarRegistroWallet,
  registroWalletPendiente,
  establecerPinWallet,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoPin } from "@/components/campo-pin";

const WALLETS = [
  { id: "phantom", nombre: "Phantom", icono: "/wallets/phantom.png", url: "https://phantom.app" },
  { id: "solflare", nombre: "Solflare", icono: "/wallets/solflare.jpg", url: "https://solflare.com" },
];

type SubPaso = "usuario" | "pin";

/**
 * Botones de wallet (Phantom / Solflare) con conexión real de Solana. Conecta la
 * wallet, firma un mensaje con el nonce del servidor (off-chain, no gasta SOL) y:
 * - login: verifica e inicia sesión;
 * - registro: deja el registro pendiente (persistente) y pide @usuario y, opcional,
 *   un PIN para acciones internas. Si el usuario abandona tras firmar, al volver
 *   retoma en @usuario sin firmar de nuevo. Termina en el onboarding.
 */
export function BotonesWallet({
  accion = "entrar",
}: {
  accion?: "entrar" | "registrarte";
}) {
  const router = useRouter();
  const { connect, connectors, isReady } = useWalletConnection();
  const [procesando, setProcesando] = useState<string | null>(null);
  const proposito = accion === "registrarte" ? "registro" : "login";

  // Registro: dirección de la wallet de un registro pendiente (firmado, sin @usuario).
  const [pendiente, setPendiente] = useState<{ address: string } | null>(null);
  const [subPaso, setSubPaso] = useState<SubPaso>("usuario");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  // Al volver a la pantalla de registro, retoma un registro a medias (sin re-firmar).
  useEffect(() => {
    if (proposito !== "registro") return;
    registroWalletPendiente().then((p) => {
      if (p) {
        setSubPaso("usuario");
        setPendiente(p);
      }
    });
  }, [proposito]);

  function connectorDe(walletId: string) {
    return connectors.find((c) => c.name.toLowerCase().includes(walletId));
  }

  async function alClic(w: (typeof WALLETS)[number]) {
    const conn = connectorDe(w.id);
    if (!conn) {
      toast(`No detectamos ${w.nombre}`, {
        description: `Instálala desde ${w.url} y vuelve a intentar.`,
      });
      return;
    }
    setProcesando(w.id);
    try {
      const session = await connect(conn.id);
      const address = String(session.account.address);
      if (!session.signMessage) {
        throw new Error("Esta wallet no permite firmar mensajes.");
      }
      const { mensaje, nonce } = await generarNonceWallet(address, proposito);
      const firmaBytes = await session.signMessage(
        new TextEncoder().encode(mensaje),
      );
      const firma = bs58.encode(firmaBytes);

      if (proposito === "login") {
        const res = await loginConWallet({ address, firma, nonce });
        if (res.error) {
          if (res.error.includes("no está registrada")) {
            toast.error(res.error, {
              action: {
                label: "Registrarme",
                onClick: () => router.push("/registro"),
              },
            });
          } else {
            toast.error(res.error);
          }
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        // Deja el registro pendiente (persistente) y pasa a elegir @usuario.
        const res = await iniciarRegistroWallet({ address, firma, nonce });
        if (res.error) {
          if (res.error.includes("ya está registrada")) {
            toast.error(res.error, {
              action: {
                label: "Iniciar sesión",
                onClick: () => router.push("/login"),
              },
            });
          } else {
            toast.error(res.error);
          }
        } else {
          setError("");
          setSubPaso("usuario");
          setPendiente({ address });
        }
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      toast.error(
        /reject|denied|cancel|user/i.test(msg)
          ? "Cancelaste la firma en tu wallet."
          : msg || "No se pudo conectar la wallet.",
      );
    } finally {
      setProcesando(null);
    }
  }

  async function crearCuenta() {
    setTrabajando(true);
    setError("");
    const res = await completarRegistroWallet(nombreUsuario);
    setTrabajando(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSubPaso("pin");
    }
  }

  async function guardarPin() {
    setTrabajando(true);
    setError("");
    const res = await establecerPinWallet(pin);
    setTrabajando(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push("/onboarding");
      router.refresh();
    }
  }

  function omitirPin() {
    router.push("/onboarding");
    router.refresh();
  }

  // ── Modal de registro con wallet (glassmorphism, por portal para cubrir todo) ──
  if (pendiente) {
    const corta = `${pendiente.address.slice(0, 4)}…${pendiente.address.slice(-4)}`;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
        <div className="max-h-[90vh] w-full max-w-sm space-y-5 overflow-y-auto rounded-3xl border border-white/10 bg-card p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              {subPaso === "usuario" ? (
                <Wallet className="size-6" />
              ) : (
                <ShieldCheck className="size-6" />
              )}
            </span>
            <h1 className="text-xl font-bold">
              {subPaso === "usuario" ? "Casi listo 🎉" : "Protege tus acciones"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Wallet conectada: <span className="font-medium">{corta}</span>
            </p>
          </div>

          {subPaso === "usuario" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="wallet-usuario">Elige tu nombre de usuario</Label>
                <Input
                  id="wallet-usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="tu_usuario"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Así te verán las demás personas en la app.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                className="w-full"
                disabled={trabajando || nombreUsuario.trim().length < 3}
                onClick={crearCuenta}
              >
                {trabajando ? "Creando…" : "Crear cuenta"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                Crea un PIN de 6 dígitos para <b className="text-foreground">confirmar
                acciones dentro de la app</b> (como aprobar pagos). No lo necesitas
                para entrar: para iniciar sesión sigues firmando con tu wallet.
              </div>
              <CampoPin onChange={setPin} autoFocus testId="wallet-pin" />
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                className="w-full"
                disabled={trabajando || !/^\d{6}$/.test(pin)}
                onClick={guardarPin}
              >
                {trabajando ? "Guardando…" : "Guardar PIN"}
              </Button>
              <button
                type="button"
                onClick={omitirPin}
                className="w-full text-center text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Omitir por ahora
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">
          O {accion} con tu wallet
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center gap-6">
        {WALLETS.map((w) => (
          <button
            key={w.id}
            type="button"
            disabled={!isReady || procesando !== null}
            onClick={() => alClic(w)}
            className="group flex flex-col items-center gap-1.5 disabled:opacity-60"
            aria-label={`${accion} con ${w.nombre}`}
          >
            <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-border/60 shadow-sm transition-transform group-hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.icono} alt={w.nombre} className="size-full object-cover" />
            </span>
            <span className="text-xs font-medium">
              {procesando === w.id ? "Conectando…" : w.nombre}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
