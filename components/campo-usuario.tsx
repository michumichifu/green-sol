"use client";

import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Estado = "idle" | "check" | "ok" | "taken" | "corto" | "largo" | "formato";

const MENSAJES: Record<Estado, string> = {
  idle: "Entre 3 y 15 caracteres: letras, números y guion bajo.",
  check: "Comprobando disponibilidad…",
  ok: "¡Disponible!",
  taken: "Ese nombre de usuario ya está en uso.",
  corto: "Mínimo 3 caracteres.",
  largo: "Máximo 15 caracteres.",
  formato: "Solo letras, números y guion bajo.",
};

export function CampoUsuario({
  id,
  name,
  value,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [estado, setEstado] = useState<Estado>("idle");

  useEffect(() => {
    const v = value.trim();
    if (v.length === 0) return setEstado("idle");
    if (v.length < 3) return setEstado("corto");
    if (v.length > 15) return setEstado("largo");
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return setEstado("formato");

    setEstado("check");
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/usuario-disponible?u=${encodeURIComponent(v)}`,
        );
        const j = await r.json();
        setEstado(j.disponible ? "ok" : "taken");
      } catch {
        setEstado("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={15}
          autoComplete="username"
          placeholder="seudónimo con el que te verán"
          className="pr-9"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {estado === "check" && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {estado === "ok" && <Check className="size-4 text-brand" />}
          {estado === "taken" && <X className="size-4 text-destructive" />}
        </span>
      </div>
      <p
        className={cn(
          "text-xs",
          estado === "ok"
            ? "text-brand"
            : estado === "idle" || estado === "check"
              ? "text-muted-foreground"
              : "text-destructive",
        )}
      >
        {MENSAJES[estado]}
      </p>
    </div>
  );
}
