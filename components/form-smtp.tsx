"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  guardarSmtp,
  verificarConexion,
  type EstadoConfigSmtp,
} from "@/app/admin/actions";
import { PruebaSmtp } from "@/components/prueba-smtp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseFrom(v: string) {
  const m = v.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { nombre: m[1].replace(/^"|"$/g, ""), correo: m[2] };
  return { nombre: "", correo: v.trim() };
}

export function FormSmtp({
  smtp,
}: {
  smtp: Record<string, string | undefined>;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoConfigSmtp, FormData>(
    guardarSmtp,
    {},
  );
  const previo = useRef<EstadoConfigSmtp>(estado);
  useEffect(() => {
    if (estado === previo.current) return;
    previo.current = estado;
    if (estado.ok) toast.success("Configuración SMTP guardada");
    else if (estado.error) toast.error(estado.error);
  }, [estado]);

  const inicial = parseFrom(smtp.SMTP_FROM ?? "");
  const [fromNombre, setFromNombre] = useState(inicial.nombre);
  const [fromCorreo, setFromCorreo] = useState(inicial.correo);
  const apareceComo =
    fromNombre && fromCorreo
      ? `"${fromNombre}" <${fromCorreo}>`
      : fromCorreo || "—";

  const [verificando, setVerificando] = useState(false);
  async function onVerificar() {
    setVerificando(true);
    try {
      const r = await verificarConexion();
      if (r.ok) toast.success("Conexión SMTP verificada ✓");
      else toast.error(r.error ?? "No se pudo verificar la conexión.");
    } finally {
      setVerificando(false);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">SMTP / Correos del sistema</h2>
        <p className="text-xs text-muted-foreground">
          Servidor de correo para verificación, OTP, reseteo de contraseña y
          avisos del sistema.
        </p>
      </div>
      <p className="rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
        Configuración cargada desde la base de datos. Los cambios se aplican al
        instante, sin reiniciar.
      </p>

      <form action={accion} className="space-y-3">
        {/* Host 80% · Puerto 20% */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-[4] space-y-1">
            <Label htmlFor="SMTP_HOST">Host SMTP</Label>
            <Input
              id="SMTP_HOST"
              name="SMTP_HOST"
              defaultValue={smtp.SMTP_HOST ?? ""}
              placeholder="mail.tudominio.com"
            />
          </div>
          <div className="min-w-0 flex-[1] space-y-1">
            <Label htmlFor="SMTP_PORT">Puerto</Label>
            <Input
              id="SMTP_PORT"
              name="SMTP_PORT"
              defaultValue={smtp.SMTP_PORT ?? ""}
              placeholder="465"
            />
          </div>
        </div>

        {/* Usuario 50% · Contraseña 50% */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="SMTP_USER">Usuario (login SMTP)</Label>
            <Input
              id="SMTP_USER"
              name="SMTP_USER"
              defaultValue={smtp.SMTP_USER ?? ""}
              placeholder="no-responder@tudominio.com"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="SMTP_PASS">
              Contraseña
              {smtp.SMTP_PASS && (
                <span className="ml-2 text-xs font-normal text-brand">
                  ✓ guardada
                </span>
              )}
            </Label>
            <Input
              id="SMTP_PASS"
              name="SMTP_PASS"
              type="password"
              placeholder={
                smtp.SMTP_PASS ? "Clave guardada · reemplazar" : "Contraseña"
              }
            />
          </div>
        </div>
        {smtp.SMTP_PASS && (
          <p className="text-xs text-muted-foreground">
            Contraseña: deja vacío y guarda para conservar la actual.
          </p>
        )}

        {/* Nombre 40% · Correo 60% */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-[2] space-y-1">
            <Label htmlFor="SMTP_FROM_NAME">Nombre del remitente</Label>
            <Input
              id="SMTP_FROM_NAME"
              name="SMTP_FROM_NAME"
              value={fromNombre}
              onChange={(e) => setFromNombre(e.target.value)}
              placeholder="Green Sol"
            />
          </div>
          <div className="min-w-0 flex-[3] space-y-1">
            <Label htmlFor="SMTP_FROM_EMAIL">Correo del remitente</Label>
            <Input
              id="SMTP_FROM_EMAIL"
              name="SMTP_FROM_EMAIL"
              type="email"
              value={fromCorreo}
              onChange={(e) => setFromCorreo(e.target.value)}
              placeholder="no-responder@tudominio.com"
            />
          </div>
        </div>

        <p className="rounded-lg border bg-muted/40 p-2.5 text-xs text-muted-foreground">
          Aparece como:{" "}
          <span className="font-mono text-foreground">{apareceComo}</span>
        </p>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card p-3">
          <span>
            <span className="block text-sm font-medium">
              Conexión segura (SSL/TLS implícita)
            </span>
            <span className="block text-xs text-muted-foreground">
              Actívala para el puerto 465. Apágala para 587 (STARTTLS).
            </span>
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              type="checkbox"
              name="SMTP_SECURE"
              defaultChecked={smtp.SMTP_SECURE === "true"}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-brand" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            disabled={pendiente}
            className="bg-brand text-white hover:bg-brand/90"
          >
            {pendiente ? "Guardando..." : "Guardar configuración"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={verificando}
            onClick={onVerificar}
          >
            {verificando ? "Verificando..." : "Verificar conexión"}
          </Button>
        </div>
      </form>

      <div className="border-t pt-3">
        <h3 className="text-sm font-medium">Envío de prueba</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Envía un correo de prueba con la configuración actual para confirmar
          que funciona de punta a punta.
        </p>
        <PruebaSmtp />
      </div>
    </section>
  );
}
