"use client";

import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { generarContrasena } from "@/lib/auth/generar-contrasena";

export function CampoContrasena({
  name,
  value,
  onChange,
  autoComplete,
  conGenerador = false,
  inputClassName,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  conGenerador?: boolean;
  inputClassName?: string;
}) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="relative">
      <Input
        id={name}
        name={name}
        type={mostrar ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`pr-16 ${inputClassName ?? ""}`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        {conGenerador && (
          <button
            type="button"
            onClick={() => {
              onChange(generarContrasena());
              setMostrar(true);
            }}
            className="text-muted-foreground hover:text-brand"
            aria-label="Generar contraseña"
            title="Generar contraseña"
          >
            <Wand2 className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setMostrar((m) => !m)}
          className="text-muted-foreground hover:text-foreground"
          aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          title={mostrar ? "Ocultar" : "Mostrar"}
        >
          {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}
