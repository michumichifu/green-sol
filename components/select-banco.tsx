"use client";

import { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { BANCOS_VE } from "@/lib/bancos-venezuela";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function SelectBanco({
  value,
  onChange,
}: {
  value: string;
  onChange: (codigo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const sel = BANCOS_VE.find((b) => b.codigo === value);
  const t = q.trim().toLowerCase();
  const filtrados = BANCOS_VE.filter(
    (b) => !t || b.codigo.includes(t) || b.nombre.toLowerCase().includes(t),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border bg-transparent px-3 text-sm"
      >
        <span className={sel ? "" : "text-muted-foreground"}>
          {sel ? `${sel.codigo} · ${sel.nombre}` : "Selecciona el banco"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card p-2 shadow-xl">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busca por código o nombre"
                className="pl-8"
                autoFocus
              />
            </div>
            <ul className="max-h-56 space-y-0.5 overflow-y-auto">
              {filtrados.map((b) => (
                <li key={b.codigo}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(b.codigo);
                      setAbierto(false);
                      setQ("");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                      b.codigo === value && "bg-brand/5",
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {b.codigo}
                    </span>
                    <span className="flex-1">{b.nombre}</span>
                    {b.codigo === value && (
                      <Check className="size-4 text-brand" />
                    )}
                  </button>
                </li>
              ))}
              {filtrados.length === 0 && (
                <li className="px-2.5 py-2 text-sm text-muted-foreground">
                  Sin resultados.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
