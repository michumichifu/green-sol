"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Fingerprint, X } from "lucide-react";
import {
  AuthShell,
  BOTON_DEGRADADO,
} from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

export default function RegistroCompletoPage() {
  const [modalVisible, setModalVisible] = useState(true);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalVisible) setModalVisible(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [modalVisible]);

  return (
    <AuthShell
      variante="registro"
      titulo="¡Tu cuenta está lista!"
      subtitulo="Ya puedes entrar a Green Sol"
      header={<span />}
    >
      <div className="space-y-6 text-center">
        {/* Ícono de éxito */}
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="size-10 text-brand" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Verificaste tu correo y creaste tu PIN. ¡Estás listo para empezar a
          ahorrar en grupo con Green Sol!
        </p>

        <Link href="/login" className={BOTON_DEGRADADO + " inline-flex items-center justify-center"}>
          Iniciar sesión
        </Link>
      </div>

      {/* Pop-up informativo de biometría */}
      {modalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div
            className="w-full max-w-sm rounded-[1.75rem] border border-border/60 bg-card p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bio-modal-titulo"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <Fingerprint className="size-5 text-brand" />
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setModalVisible(false)}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2 id="bio-modal-titulo" className="mb-2 text-lg font-bold">Mayor seguridad con tu huella</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Usaremos tu biometría (huella o Face ID) para que entres más
              rápido y de forma más segura. Puedes activarla desde tu perfil en
              cualquier momento.
            </p>
            <Button
              type="button"
              className={BOTON_DEGRADADO}
              onClick={() => setModalVisible(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
