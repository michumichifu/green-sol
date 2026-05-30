"use client";

import { useActionState, useState } from "react";
import { crearRecolecta, type EstadoRecolecta } from "../actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CrearPage() {
  const [estado, accion, pendiente] = useActionState<EstadoRecolecta, FormData>(
    crearRecolecta,
    {},
  );
  const [tipo, setTipo] = useState<"san" | "vaca">("san");
  const [visibilidad, setVisibilidad] = useState<"privado" | "publico">(
    "privado",
  );

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <form action={accion} className="space-y-4">
        <h1 className="text-2xl font-bold">Crear recolecta</h1>
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="visibilidad" value={visibilidad} />

        <div className="grid grid-cols-2 gap-2">
          {(["san", "vaca"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-lg border p-3 text-sm",
                tipo === t
                  ? "border-brand bg-brand/10 text-brand"
                  : "text-muted-foreground",
              )}
            >
              {t === "san" ? "San (por turnos)" : "Vaca (meta común)"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            required
            placeholder="Ej: San de la oficina"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto">
            {tipo === "san" ? "Aporte por turno (USD)" : "Meta (USD)"}
          </Label>
          <Input
            id="monto"
            name="monto"
            type="number"
            inputMode="decimal"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(["privado", "publico"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibilidad(v)}
              className={cn(
                "rounded-lg border p-2 text-sm capitalize",
                visibilidad === v
                  ? "border-brand bg-brand/10 text-brand"
                  : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {estado.error && (
          <p className="text-sm text-destructive">{estado.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pendiente}>
          {pendiente ? "Creando..." : "Crear"}
        </Button>
      </form>
    </main>
  );
}
