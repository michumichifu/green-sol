"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import {
  enviarVerificacion,
  type EstadoEnvioKyc,
} from "@/app/(app)/configuracion/kyc-actions";
import type { PasosRequeridos } from "@/lib/kyc/config";
import { SubirImagen } from "@/components/kyc/subir-imagen";
import { CapturaVideo } from "@/components/kyc/captura-video";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasoId = "documento" | "selfie" | "video" | "direccion" | "revisar";

export function AsistenteKyc({ pasos }: { pasos: PasosRequeridos }) {
  const [estado, accion, pendiente] = useActionState<EstadoEnvioKyc, FormData>(
    enviarVerificacion,
    {},
  );

  const [tipoDocumento, setTipoDocumento] = useState<"" | "cedula" | "pasaporte">("");
  const [nacionalidad, setNacionalidad] = useState<"" | "V" | "E">("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [docFrente, setDocFrente] = useState<File | null>(null);
  const [docReverso, setDocReverso] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [estadoRegion, setEstadoRegion] = useState("");

  const orden = useMemo<PasoId[]>(() => {
    const l: PasoId[] = [];
    if (pasos.DOCUMENTO) l.push("documento");
    if (pasos.SELFIE) l.push("selfie");
    if (pasos.VIDEO) l.push("video");
    if (pasos.DIRECCION) l.push("direccion");
    l.push("revisar");
    return l;
  }, [pasos]);

  const [i, setI] = useState(0);
  const pasoActual = orden[i];

  const esCedula = tipoDocumento === "cedula";
  const docOk =
    !pasos.DOCUMENTO ||
    (!!tipoDocumento &&
      numeroDocumento.trim().length > 0 &&
      !!docFrente &&
      (!esCedula || (!!nacionalidad && !!docReverso)));
  const selfieOk = !pasos.SELFIE || !!selfie;
  const videoOk = !pasos.VIDEO || !!video;
  const direccionOk =
    !pasos.DIRECCION || (!!direccion.trim() && !!ciudad.trim() && !!estadoRegion.trim());
  const todoOk = docOk && selfieOk && videoOk && direccionOk;

  const pasoOk: Record<PasoId, boolean> = {
    documento: docOk,
    selfie: selfieOk,
    video: videoOk,
    direccion: direccionOk,
    revisar: todoOk,
  };

  function enviar() {
    const fd = new FormData();
    if (pasos.DOCUMENTO) {
      fd.set("tipoDocumento", tipoDocumento);
      fd.set("nacionalidad", nacionalidad);
      fd.set("numeroDocumento", numeroDocumento);
      if (docFrente) fd.set("docFrente", docFrente);
      if (docReverso) fd.set("docReverso", docReverso);
    }
    if (pasos.SELFIE && selfie) fd.set("selfie", selfie);
    if (pasos.VIDEO && video) fd.set("video", video);
    if (pasos.DIRECCION) {
      fd.set("direccion", direccion);
      fd.set("ciudad", ciudad);
      fd.set("estadoRegion", estadoRegion);
    }
    accion(fd);
  }

  // Al enviarse bien, el server revalida y este asistente se desmonta solo.
  useEffect(() => {
    if (estado.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado.ok]);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      {/* Progreso */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-brand" />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((i + 1) / orden.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {i + 1}/{orden.length}
        </span>
      </div>

      <div key={pasoActual} className="animate-in fade-in slide-in-from-right-2 duration-300">
        {pasoActual === "documento" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Tu documento de identidad</p>
            <div className="grid grid-cols-2 gap-2">
              {(["cedula", "pasaporte"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipoDocumento(t)}
                  className={cn(
                    "rounded-xl border bg-transparent py-2.5 text-sm font-medium capitalize transition-colors",
                    tipoDocumento === t ? "border-brand text-brand" : "border-input hover:border-brand/40",
                  )}
                >
                  {t === "cedula" ? "Cédula" : "Pasaporte"}
                </button>
              ))}
            </div>
            {esCedula && (
              <div className="flex gap-2">
                {(["V", "E"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNacionalidad(n)}
                    className={cn(
                      "flex-1 rounded-xl border bg-transparent py-2 text-sm font-medium transition-colors",
                      nacionalidad === n ? "border-brand text-brand" : "border-input hover:border-brand/40",
                    )}
                  >
                    {n === "V" ? "V — Venezolano" : "E — Extranjero"}
                  </button>
                ))}
              </div>
            )}
            {!!tipoDocumento && (
              <Input
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                inputMode="numeric"
                placeholder={esCedula ? "Número de cédula" : "Número de pasaporte"}
              />
            )}
            <SubirImagen
              label="Foto del frente"
              hint="Que se lea bien y sin reflejos."
              onArchivo={setDocFrente}
              testId="kyc-doc-frente"
            />
            {esCedula && (
              <SubirImagen
                label="Foto del reverso"
                onArchivo={setDocReverso}
                testId="kyc-doc-reverso"
              />
            )}
          </div>
        )}

        {pasoActual === "selfie" && (
          <SubirImagen
            label="Selfie de tu cara"
            hint="Sin lentes ni gorra, buena luz, mirando a la cámara."
            onArchivo={setSelfie}
            testId="kyc-selfie"
          />
        )}

        {pasoActual === "video" && <CapturaVideo onArchivo={setVideo} />}

        {pasoActual === "direccion" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Tu dirección</p>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} placeholder="Ciudad" />
              <Input value={estadoRegion} onChange={(e) => setEstadoRegion(e.target.value)} placeholder="Estado" />
            </div>
          </div>
        )}

        {pasoActual === "revisar" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Revisa y envía</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {pasos.DOCUMENTO && (
                <li>
                  Documento: <span className="text-foreground">{tipoDocumento === "cedula" ? `Cédula ${nacionalidad}-${numeroDocumento}` : `Pasaporte ${numeroDocumento}`}</span>
                </li>
              )}
              {pasos.SELFIE && <li>Selfie: <span className="text-foreground">{selfie ? "lista" : "—"}</span></li>}
              {pasos.VIDEO && <li>Video: <span className="text-foreground">{video ? "grabado" : "—"}</span></li>}
              {pasos.DIRECCION && <li>Dirección: <span className="text-foreground">{ciudad}, {estadoRegion}</span></li>}
            </ul>
            <p className="text-xs text-muted-foreground">
              Al enviar, un administrador revisará tu identidad. Te avisaremos por la
              campanita y por correo.
            </p>
          </div>
        )}
      </div>

      {estado.error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {estado.error}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-2">
        {i > 0 && (
          <button
            type="button"
            onClick={() => setI((n) => n - 1)}
            className="flex items-center gap-1 rounded-xl border px-4 py-2.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" /> Atrás
          </button>
        )}
        {pasoActual !== "revisar" ? (
          <button
            type="button"
            disabled={!pasoOk[pasoActual]}
            onClick={() => setI((n) => n + 1)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors",
              pasoOk[pasoActual] ? "bg-brand" : "bg-muted-foreground/40",
            )}
          >
            Siguiente <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!todoOk || pendiente}
            onClick={enviar}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors",
              todoOk && !pendiente ? "bg-brand" : "bg-muted-foreground/40",
            )}
          >
            {pendiente ? "Enviando…" : "Enviar verificación"}
          </button>
        )}
      </div>
    </div>
  );
}
