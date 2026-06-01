"use client";

import { useEffect, useRef, useState } from "react";
import { Video, Square, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SEG = 7;
const MAX_SEG = 10;
const MAX_BYTES = 20 * 1024 * 1024;

// Instrucciones guiadas que se muestran durante la grabación.
const GUIA = [
  { en: 0, txt: "Mira a la cámara y pestañea despacio" },
  { en: 3, txt: "Abre y cierra la boca 3 veces" },
  { en: 6, txt: "Muestra 3 dedos frente a tu cara" },
];

/**
 * Graba un video corto de liveness (7-10 s) con MediaRecorder y entrega el File
 * al padre. La validación real (que la cara coincide) la hace un humano.
 */
export function CapturaVideo({
  onArchivo,
}: {
  onArchivo: (f: File | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [estado, setEstado] = useState<"idle" | "listo" | "grabando" | "hecho">("idle");
  const [seg, setSeg] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [urlPreview, setUrlPreview] = useState<string | null>(null);

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
      : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
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
    rec.start();
    setEstado("grabando");
    setSeg(0);
  }

  // Temporizador de grabación: corta solo al llegar al máximo.
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
    <div className="space-y-2">
      <p className="text-sm font-medium">Video de verificación (7-10 s)</p>
      <p className="text-xs text-muted-foreground">
        Sostén el teléfono frente a tu cara y sigue las indicaciones.
      </p>

      <div className="relative overflow-hidden rounded-2xl border bg-black aspect-[3/4]">
        {estado === "hecho" && urlPreview ? (
          <video src={urlPreview} controls playsInline className="size-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline className="size-full object-cover" />
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
            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-center text-xs font-medium text-white">
              {guiaActual}
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white">
              <span className="size-2 animate-pulse rounded-full bg-white" /> {seg}s
            </div>
          </>
        )}

        {estado === "hecho" && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
            <Check className="size-3.5" /> Listo
          </div>
        )}
      </div>

      {estado === "listo" && (
        <button
          type="button"
          onClick={empezar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white"
        >
          <Video className="size-4" /> Empezar a grabar
        </button>
      )}
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
