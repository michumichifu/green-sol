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
  Search,
  Lock,
  BadgeCheck,
} from "lucide-react";
import type { EstadoKyc } from "@prisma/client";
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

const ETIQUETA_ESTADO: Record<EstadoKyc, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  reenvio_solicitado: "Reenvío solicitado",
  baneada: "Baneada",
};

type Urls = { docFrente?: string; docReverso?: string; selfie?: string; video?: string };
type Pendiente = { accion: AccionRevision; motivo: string; nota: string } | null;

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
  const [gestionar, setGestionar] = useState(false); // desplegar acciones en aprobadas
  const [pend, setPend] = useState<Pendiente>(null); // acción esperando credencial
  const [credencial, setCredencial] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  async function verArchivos() {
    setCargandoUrls(true);
    setUrls(await urlsRevision(s.id));
    setCargandoUrls(false);
  }
  function tomar() {
    startTransition(async () => {
      await tomarRevision(s.id);
    });
  }
  // Pide credencial antes de ejecutar (anti clic accidental).
  function pedirConfirmacion(accion: AccionRevision) {
    if ((accion === "rechazar" || accion === "reenvio") && !motivo.trim()) {
      setErr("Escribe el motivo para el usuario antes de continuar.");
      return;
    }
    setErr(null);
    setCredencial("");
    setPend({ accion, motivo, nota });
  }
  function confirmar() {
    if (!pend) return;
    startTransition(async () => {
      const r = await resolverKyc(s.id, pend.accion, credencial, pend.motivo, pend.nota);
      if (r.error) setErr(r.error);
      else setPend(null);
    });
  }

  const enRevision = s.estado === "en_revision";
  const aprobada = s.estado === "aprobada";

  const ETIQUETA_ACCION: Record<AccionRevision, string> = {
    aprobar: "Aprobar",
    reenvio: "Pedir reenvío",
    rechazar: "Rechazar",
    banear: "Rechazar y banear",
  };

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {nombreDe(s.usuario)}
            {aprobada && <BadgeCheck className="size-4 shrink-0 text-brand" />}
          </p>
          {s.usuario.nombreUsuario && (
            <p className="truncate text-xs text-brand">@{s.usuario.nombreUsuario}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{s.usuario.correo}</p>
          <p className="mt-1 text-xs">{docDe(s)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {ETIQUETA_ESTADO[s.estado]}
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

      {/* Aprobada: gestionar (revertir) */}
      {aprobada && !gestionar && (
        <button
          type="button"
          onClick={() => setGestionar(true)}
          className="w-full rounded-xl border py-2 text-xs font-medium text-muted-foreground"
        >
          Gestionar (revertir / banear)
        </button>
      )}

      {(enRevision || (aprobada && gestionar)) && (
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
            {enRevision && (
              <BotonAccion onClick={() => pedirConfirmacion("aprobar")} disabled={pendiente} color="brand" icon={<Check className="size-4" />}>
                Aprobar
              </BotonAccion>
            )}
            <BotonAccion onClick={() => pedirConfirmacion("reenvio")} disabled={pendiente} color="gold" icon={<RotateCcw className="size-4" />}>
              {aprobada ? "Desverificar (reenvío)" : "Pedir reenvío"}
            </BotonAccion>
            <BotonAccion onClick={() => pedirConfirmacion("rechazar")} disabled={pendiente} color="muted" icon={<X className="size-4" />}>
              Rechazar
            </BotonAccion>
            <BotonAccion onClick={() => pedirConfirmacion("banear")} disabled={pendiente} color="destructive" icon={<Ban className="size-4" />}>
              Rechazar y banear
            </BotonAccion>
          </div>
        </div>
      )}

      {err && !pend && <p className="text-xs text-destructive">{err}</p>}

      {/* Confirmación con credencial */}
      {pend && (
        <div className="space-y-2 rounded-xl border border-brand/40 bg-brand/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Lock className="size-4 text-brand" /> Confirma: {ETIQUETA_ACCION[pend.accion]}
          </p>
          <p className="text-xs text-muted-foreground">
            Ingresa tu PIN o contraseña de super-admin para continuar.
          </p>
          <input
            type="password"
            value={credencial}
            onChange={(e) => setCredencial(e.target.value)}
            placeholder="PIN o contraseña"
            autoComplete="off"
            className="w-full rounded-lg border bg-background px-2.5 py-2 text-sm"
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setPend(null); setErr(null); }}
              className="flex-1 rounded-xl border py-2 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={pendiente || !credencial.trim()}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-white",
                credencial.trim() && !pendiente ? "bg-brand" : "bg-muted-foreground/40",
              )}
            >
              {pendiente ? <Loader2 className="size-4 animate-spin" /> : "Confirmar"}
            </button>
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
      <p className="text-xs text-muted-foreground">Enciende o apaga lo que pedimos en la verificación.</p>
      {PASOS_KYC.map((p) => (
        <label key={p} className="flex items-center justify-between py-1.5">
          <span className="text-sm">{ETIQUETA_PASO[p]}</span>
          <button
            type="button"
            role="switch"
            aria-checked={estado[p]}
            onClick={() => alternar(p)}
            className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", estado[p] ? "bg-brand" : "bg-muted")}
          >
            <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", estado[p] ? "left-[22px]" : "left-0.5")} />
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
  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();
  const filtrar = (arr: SolicitudVista[]) =>
    !t
      ? arr
      : arr.filter((s) =>
          [s.usuario.nombre, s.usuario.apellido, s.usuario.nombreUsuario, s.usuario.correo]
            .filter(Boolean)
            .some((c) => c!.toLowerCase().includes(t)),
        );

  const lista = (arr: SolicitudVista[]) => {
    const f = filtrar(arr);
    return f.length === 0 ? (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t ? "Sin coincidencias." : "Nada por aquí."}
      </p>
    ) : (
      <div className="space-y-3">
        {f.map((s) => (
          <Tarjeta key={s.id} s={s} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Toggles pasos={pasos} />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, usuario o correo"
          className="w-full rounded-xl border bg-background py-2 pl-8 pr-3 text-sm"
        />
      </div>
      <PanelTabs
        variante="sub"
        tabs={[`Pendientes (${filtrar(pendientes).length})`, "Aprobadas", "Rechazadas"]}
      >
        {lista(pendientes)}
        {lista(aprobadas)}
        {lista(rechazadas)}
      </PanelTabs>
    </div>
  );
}
