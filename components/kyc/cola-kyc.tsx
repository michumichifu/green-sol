"use client";

import { useState, useTransition } from "react";
import {
  ShieldCheck,
  Eye,
  Check,
  RotateCcw,
  X,
  Ban,
  Loader2,
} from "lucide-react";
import {
  tomarRevision,
  resolverKyc,
  urlsRevision,
  guardarPasosKyc,
  type AccionRevision,
} from "@/app/admin/kyc-actions";
import { PASOS_KYC, ETIQUETA_PASO, type PasosRequeridos, type PasoKyc } from "@/lib/kyc/config";
import type { SolicitudVista } from "@/lib/kyc/consultas";
import { PanelTabs } from "@/components/panel-tabs";
import { cn } from "@/lib/utils";

type Urls = { docFrente?: string; docReverso?: string; selfie?: string; video?: string };

function nombreDe(u: SolicitudVista["usuario"]) {
  const n = [u.nombre, u.apellido].filter(Boolean).join(" ");
  return n || u.nombreUsuario || u.correo;
}

function docDe(s: SolicitudVista) {
  if (!s.tipoDocumento) return "—";
  return s.tipoDocumento === "cedula"
    ? `Cédula ${s.nacionalidad ?? ""}-${s.numeroDocumento ?? ""}`
    : `Pasaporte ${s.numeroDocumento ?? ""}`;
}

function Tarjeta({ s }: { s: SolicitudVista }) {
  const [urls, setUrls] = useState<Urls | null>(null);
  const [cargandoUrls, setCargandoUrls] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [nota, setNota] = useState("");
  const [pendiente, startTransition] = useTransition();

  async function verArchivos() {
    setCargandoUrls(true);
    setUrls(await urlsRevision(s.id));
    setCargandoUrls(false);
  }

  function accion(a: AccionRevision) {
    startTransition(async () => {
      await resolverKyc(s.id, a, motivo, nota);
    });
  }
  function tomar() {
    startTransition(async () => {
      await tomarRevision(s.id);
    });
  }

  const enRevision = s.estado === "en_revision";

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{nombreDe(s.usuario)}</p>
          <p className="truncate text-xs text-muted-foreground">{s.usuario.correo}</p>
          <p className="mt-1 text-xs">{docDe(s)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
          {s.estado.replace("_", " ")}
        </span>
      </div>

      {/* Archivos */}
      {urls ? (
        <div className="grid grid-cols-3 gap-2">
          {urls.docFrente && <Miniatura url={urls.docFrente} etiqueta="Frente" />}
          {urls.docReverso && <Miniatura url={urls.docReverso} etiqueta="Reverso" />}
          {urls.selfie && <Miniatura url={urls.selfie} etiqueta="Selfie" />}
          {urls.video && (
            <a
              href={urls.video}
              target="_blank"
              rel="noreferrer"
              className="col-span-3 rounded-lg border bg-muted/40 p-2 text-center text-xs font-medium text-brand"
            >
              ▶ Ver video de liveness
            </a>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={verArchivos}
          disabled={cargandoUrls}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium"
        >
          {cargandoUrls ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
          Ver documentos
        </button>
      )}

      {/* Motivo/nota históricos */}
      {s.motivoRechazo && (
        <p className="rounded-lg bg-muted/50 p-2 text-xs">
          <span className="font-medium">Motivo:</span> {s.motivoRechazo}
        </p>
      )}
      {s.notaInterna && (
        <p className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
          <span className="font-medium">Nota interna:</span> {s.notaInterna}
        </p>
      )}

      {/* Acciones */}
      {s.estado === "pendiente" && (
        <button
          type="button"
          onClick={tomar}
          disabled={pendiente}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white"
        >
          {pendiente ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          Tomar para revisar
        </button>
      )}

      {enRevision && (
        <div className="space-y-2 border-t pt-3">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo para el usuario (si rechazas o pides reenvío)"
            className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
          />
          <input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota interna (solo super-admin, opcional)"
            className="w-full rounded-lg border bg-background px-2.5 py-2 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <BotonAccion onClick={() => accion("aprobar")} disabled={pendiente} color="brand" icon={<Check className="size-4" />}>
              Aprobar
            </BotonAccion>
            <BotonAccion onClick={() => accion("reenvio")} disabled={pendiente} color="gold" icon={<RotateCcw className="size-4" />}>
              Pedir reenvío
            </BotonAccion>
            <BotonAccion onClick={() => accion("rechazar")} disabled={pendiente} color="muted" icon={<X className="size-4" />}>
              Rechazar
            </BotonAccion>
            <BotonAccion onClick={() => accion("banear")} disabled={pendiente} color="destructive" icon={<Ban className="size-4" />}>
              Rechazar y banear
            </BotonAccion>
          </div>
        </div>
      )}
    </div>
  );
}

function Miniatura({ url, etiqueta }: { url: string; etiqueta: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={etiqueta} className="aspect-square w-full rounded-lg border object-cover" />
      <p className="text-center text-[10px] text-muted-foreground">{etiqueta}</p>
    </a>
  );
}

function BotonAccion({
  children,
  onClick,
  disabled,
  color,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  color: "brand" | "gold" | "muted" | "destructive";
  icon: React.ReactNode;
}) {
  const clases = {
    brand: "bg-brand text-white",
    gold: "bg-gold/15 text-gold border border-gold/40",
    muted: "border text-foreground",
    destructive: "bg-destructive/10 text-destructive border border-destructive/40",
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn("flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold", clases)}
    >
      {icon} {children}
    </button>
  );
}

function Toggles({ pasos }: { pasos: PasosRequeridos }) {
  const [estado, setEstado] = useState(pasos);
  const [, startTransition] = useTransition();

  function alternar(p: PasoKyc) {
    const nuevo = { ...estado, [p]: !estado[p] };
    setEstado(nuevo);
    startTransition(async () => {
      await guardarPasosKyc({ [p]: nuevo[p] });
    });
  }

  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <p className="text-sm font-semibold">Pasos requeridos</p>
      <p className="text-xs text-muted-foreground">
        Enciende o apaga lo que pedimos en la verificación.
      </p>
      {PASOS_KYC.map((p) => (
        <label key={p} className="flex items-center justify-between py-1.5">
          <span className="text-sm">{ETIQUETA_PASO[p]}</span>
          <button
            type="button"
            role="switch"
            aria-checked={estado[p]}
            onClick={() => alternar(p)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              estado[p] ? "bg-brand" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                estado[p] ? "left-[22px]" : "left-0.5",
              )}
            />
          </button>
        </label>
      ))}
    </div>
  );
}

export function ColaKyc({
  pendientes,
  aprobadas,
  rechazadas,
  pasos,
}: {
  pendientes: SolicitudVista[];
  aprobadas: SolicitudVista[];
  rechazadas: SolicitudVista[];
  pasos: PasosRequeridos;
}) {
  const lista = (arr: SolicitudVista[]) =>
    arr.length === 0 ? (
      <p className="py-6 text-center text-sm text-muted-foreground">Nada por aquí.</p>
    ) : (
      <div className="space-y-3">
        {arr.map((s) => (
          <Tarjeta key={s.id} s={s} />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      <Toggles pasos={pasos} />
      <PanelTabs
        variante="sub"
        tabs={[`Pendientes (${pendientes.length})`, "Aprobadas", "Rechazadas"]}
      >
        {lista(pendientes)}
        {lista(aprobadas)}
        {lista(rechazadas)}
      </PanelTabs>
    </div>
  );
}
