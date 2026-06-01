"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 5 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "application/pdf"];

/**
 * Captura una imagen/PDF (documento o selfie). No sube nada: entrega el File al
 * padre, que lo envía junto al resto en un solo formulario (Server Action).
 */
export function SubirImagen({
  label,
  hint,
  onArchivo,
}: {
  label: string;
  hint?: string;
  onArchivo: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previo, setPrevio] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function elegir(f: File | null) {
    setError(null);
    if (!f) return;
    if (!TIPOS.includes(f.type)) {
      setError("Solo JPG, PNG o PDF.");
      return;
    }
    if (f.size > MAX) {
      setError("Máximo 5 MB.");
      return;
    }
    setNombre(f.name);
    setPrevio(f.type === "application/pdf" ? null : URL.createObjectURL(f));
    onArchivo(f);
  }

  function quitar() {
    setPrevio(null);
    setNombre(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onArchivo(null);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        capture="environment"
        className="hidden"
        onChange={(e) => elegir(e.target.files?.[0] ?? null)}
      />
      {nombre ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-2.5">
          {previo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previo} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-6 text-muted-foreground" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-sm">{nombre}</span>
          <button
            type="button"
            onClick={quitar}
            aria-label="Quitar"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-5 text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground",
            error && "border-destructive text-destructive",
          )}
        >
          <Upload className="size-4" /> Tomar foto o subir archivo
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
