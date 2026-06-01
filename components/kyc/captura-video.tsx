"use client";

import { useEffect, useRef, useState } from "react";
import { Video, Square, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SEG = 7;
const MAX_SEG = 10;
const MAX_BYTES = 20 * 1024 * 1024;

// Los 3 gestos del liveness. `corto` se muestra en las tarjetas; `txt` encima del video.
const GUIA = [
  { en: 0, corto: "Pestañea 3 veces", txt: "Pestañea 3 veces mirando a la cámara" },
  { en: 3, corto: "Abre la boca 3 veces", txt: "Abre y cierra la boca 3 veces" },
  { en: 6, corto: "Muestra 3 dedos", txt: "Muestra 3 dedos frente a tu cara" },
];

/**
 * Graba un video corto de liveness (7-10 s) con MediaRecorder y entrega el File
 * al padre. La validación real (que la cara coincide) la hace un humano.
 * `valor` recupera la vista previa al volver a este paso.
 */
export function CapturaVideo({
  onArchivo,
  valor,
}: {
  onArchivo: (f: File | null) => void;
  valor?: File | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [estado, setEstado] = useState<"idle" | "listo" | "grabando" | "hecho">("idle");
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

  // Si ya hay un video grabado (volvimos a este paso), recuperar la vista previa.
  useEffect(() => {
    if (valor && estado === "idle") {
      setUrlPreview(URL.createObjectURL(valor));
      setEstado("hecho");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function pedirCamara() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }
      setEstado("listo");
    } catch {
      setError("No pudimos acceder a la cámara. Revisa los permisos del navegador.");
    }
  }

  function empezar() {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (blob.size === 0) {
        setError("No se capturó el video. Intenta de nuevo.");
        setEstado("listo");
        return;
      }
      if (blob.size > MAX_BYTES) {
        setError("El video quedó muy pesado. Intenta de nuevo (más corto).");
        setEstado("listo");
        return;
      }
      const file = new File([blob], "liveness.webm", { type: "video/webm" });
      setUrlPreview(URL.createObjectURL(blob));
      onArchivo(file);
      setEstado("hecho");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    recRef.current = rec;
    // timeslice de 1s: fuerza ondataavailable periódico y evita blobs vacíos.
    rec.start(1000);
    setEstado("grabando");
    setSeg(0);
  }

  useEffect(() => {
    if (estado !== "grabando") return;
    const t = setInterval(() => {
      setSeg((s) => {
        const n = s + 1;
        if (n >= MAX_SEG) detener();
        return n;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function detener() {
    if (recRef.current && recRef.current.state !== "inactive") {
      recRef.current.stop();
    }
  }

  function rehacer() {
    setUrlPreview(null);
    setSeg(0);
    setEstado("idle");
    onArchivo(null);
  }

  const guiaActual = [...GUIA].reverse().find((g) => seg >= g.en)?.txt ?? GUIA[0].txt;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Video de verificación (7-10 s)</p>
        <p className="text-xs text-muted-foreground">
          Sostén el teléfono frente a tu cara y sigue estos 3 pasos:
        </p>
      </div>

      {/* Los 3 pasos en una sola línea, para que se lean ANTES de grabar */}
      <div className="grid grid-cols-3 gap-1.5">
        {GUIA.map((g, idx) => (
          <div key={g.corto} className="rounded-lg border bg-muted/40 p-2 text-center">
            <span className="mx-auto mb-1 flex size-5 items-center justify-center rounded-full bg-brand/15 text-[11px] font-bold text-brand">
              {idx + 1}
            </span>
            <p className="text-[10px] font-medium leading-tight">{g.corto}</p>
          </div>
        ))}
      </div>

      <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden rounded-2xl border bg-black">
        {estado === "hecho" && urlPreview ? (
          <video
            src={urlPreview}
            controls
            autoPlay
            muted
            loop
            playsInline
            className="size-full object-cover"
          />
        ) : (
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
        )}

        {estado === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 text-white">
            <Video className="size-8" />
            <button
              type="button"
              onClick={pedirCamara}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Encender cámara
            </button>
          </div>
        )}

        {estado === "grabando" && (
          <>
            {/* Indicación resaltada para que se note y se lea a tiempo */}
            <div className="absolute inset-x-3 top-3 rounded-xl bg-black/75 px-3 py-2 text-center text-sm font-semibold text-white shadow-lg">
              {guiaActual}
            </div>
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white">
              <span className="size-2 animate-pulse rounded-full bg-white" /> {seg}s
            </div>
          </>
        )}

        {estado === "hecho" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
            <Check className="size-3.5" /> Grabado
          </div>
        )}

        {/* Botón de grabar SUPERPUESTO y rojo: deja claro que aún no se está grabando */}
        {estado === "listo" && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <button
              type="button"
              onClick={empezar}
              className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-bold text-white shadow-lg ring-4 ring-white/30"
            >
              <span className="size-3 rounded-full bg-white" /> Empezar a grabar
            </button>
          </div>
        )}
      </div>

      {estado === "grabando" && (
        <button
          type="button"
          onClick={detener}
          disabled={seg < MIN_SEG}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white",
            seg < MIN_SEG ? "bg-muted-foreground/40" : "bg-destructive",
          )}
        >
          <Square className="size-4" />
          {seg < MIN_SEG ? `Graba ${MIN_SEG - seg}s más…` : "Detener"}
        </button>
      )}
      {estado === "hecho" && (
        <button
          type="button"
          onClick={rehacer}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium"
        >
          <RotateCcw className="size-4" /> Volver a grabar
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
