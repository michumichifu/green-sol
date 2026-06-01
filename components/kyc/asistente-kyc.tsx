"use client";

import { useActionState, useEffect, useMemo, useState, startTransition } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, X } from "lucide-react";
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

const INSTR_DOC =
  "Colócalo sobre una superficie plana y lisa, sin otros objetos alrededor. Que se lea bien y completo, sin reflejos, sombras ni borrosidad.";

export function AsistenteKyc({
  pasos,
  onCerrar,
}: {
  pasos: PasosRequeridos;
  onCerrar: () => void;
}) {
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
  // Datos de texto del documento listos → recién entonces se piden las fotos.
  const datosDocListos =
    !!tipoDocumento &&
    numeroDocumento.trim().length > 0 &&
    (!esCedula || !!nacionalidad);
  const docOk =
    !pasos.DOCUMENTO ||
    (datosDocListos && !!docFrente && (!esCedula || !!docReverso));
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
    // useActionState exige que el dispatch corra dentro de una transición.
    startTransition(() => accion(fd));
  }

  // Al enviarse bien, cerrar el modal (el item pasa a "En revisión" tras revalidar).
  useEffect(() => {
    if (estado.ok) onCerrar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.ok]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        className="flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl animate-in slide-in-from-bottom-5 duration-300 sm:h-auto sm:max-h-[88vh] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ShieldCheck className="size-5 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Verificación de identidad</p>
            <p className="text-xs text-muted-foreground">
              Paso {i + 1} de {orden.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${((i + 1) / orden.length) * 100}%` }}
          />
        </div>

        {/* Contenido del paso */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div key={pasoActual} className="animate-in fade-in slide-in-from-right-2 duration-300">
            {pasoActual === "documento" && (
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  Selecciona el tipo de documento con el que deseas iniciar tu verificación
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["cedula", "pasaporte"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoDocumento(t)}
                      className={cn(
                        "rounded-xl border bg-transparent py-3 text-sm font-medium transition-colors",
                        tipoDocumento === t
                          ? "border-brand text-brand"
                          : "border-input hover:border-brand/40",
                      )}
                    >
                      {t === "cedula" ? "Cédula de identidad" : "Pasaporte"}
                    </button>
                  ))}
                </div>

                {/* Paso 2 (progresivo): nacionalidad + número */}
                {!!tipoDocumento && (
                  <div className="space-y-3 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-700 ease-out">
                    {esCedula && (
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">Nacionalidad</p>
                        <div className="flex gap-2">
                          {(["V", "E"] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setNacionalidad(n)}
                              className={cn(
                                "flex-1 rounded-xl border bg-transparent py-2 text-sm font-medium transition-colors",
                                nacionalidad === n
                                  ? "border-brand text-brand"
                                  : "border-input hover:border-brand/40",
                              )}
                            >
                              {n === "V" ? "V · Venezolano" : "E · Extranjero"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label htmlFor="numdoc" className="text-sm font-medium">
                        {esCedula ? "Número de cédula" : "Número de pasaporte"}
                      </label>
                      <Input
                        id="numdoc"
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        inputMode={esCedula ? "numeric" : "text"}
                        placeholder={esCedula ? "Ej. 12.345.678" : "Ej. 123456789"}
                      />
                    </div>
                  </div>
                )}

                {/* Paso 3 (progresivo): fotos del documento, solo con los datos listos */}
                {datosDocListos && (
                  <div className="space-y-3 border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-700 ease-out">
                    <SubirImagen
                      label="Sube la foto frontal del documento"
                      hint={INSTR_DOC}
                      onArchivo={setDocFrente}
                      valor={docFrente}
                      testId="kyc-doc-frente"
                    />
                    {esCedula && (
                      <SubirImagen
                        label="Ahora la foto del reverso"
                        hint={INSTR_DOC}
                        onArchivo={setDocReverso}
                        valor={docReverso}
                        testId="kyc-doc-reverso"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {pasoActual === "selfie" && (
              <SubirImagen
                label="Tómate una selfie"
                hint="Mira de frente a la cámara, con buena luz, sin lentes ni gorra. Tu cara debe verse completa y nítida."
                onArchivo={setSelfie}
                valor={selfie}
                testId="kyc-selfie"
              />
            )}

            {pasoActual === "video" && <CapturaVideo onArchivo={setVideo} />}

            {pasoActual === "direccion" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Tu dirección de residencia</p>
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
                      Documento:{" "}
                      <span className="text-foreground">
                        {esCedula ? `Cédula ${nacionalidad}-${numeroDocumento}` : `Pasaporte ${numeroDocumento}`}
                      </span>
                    </li>
                  )}
                  {pasos.SELFIE && <li>Selfie: <span className="text-foreground">{selfie ? "lista ✓" : "—"}</span></li>}
                  {pasos.VIDEO && <li>Video: <span className="text-foreground">{video ? "grabado ✓" : "—"}</span></li>}
                  {pasos.DIRECCION && <li>Dirección: <span className="text-foreground">{ciudad}, {estadoRegion}</span></li>}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Al enviar, un administrador revisará tu identidad. Te avisaremos por
                  la campanita y por correo.
                </p>
                <div className="flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/5 p-2.5 text-xs">
                  <AlertCircle className="size-4 shrink-0 text-gold" />
                  <span>
                    La revisión puede tardar de <b>24 a 48 horas</b>. Gracias por tu
                    paciencia.
                  </span>
                </div>
              </div>
            )}
          </div>

          {estado.error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {estado.error}
            </div>
          )}
        </div>

        {/* Navegación (con margen seguro para la barra del sistema en móvil) */}
        <div className="flex gap-2 border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
    </div>,
    document.body,
  );
}
