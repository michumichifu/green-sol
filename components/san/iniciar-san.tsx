"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Shuffle,
  Hand,
  Sparkles,
  ArrowUp,
  ArrowDown,
  GripVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoPin } from "@/components/campo-pin";
import { RuletaSorteo } from "./ruleta-sorteo";

type ParticipanteT = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  esOrganizador: boolean;
};

function nombreDe(p: ParticipanteT) {
  return (
    [p.nombre, p.apellido].filter(Boolean).join(" ") ||
    (p.nombreUsuario ? `@${p.nombreUsuario}` : "Participante")
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pop-up para iniciar el san: elige el orden de turnos (manual o aleatorio) y confirma con PIN. */
export function IniciarSan({
  participantes,
  iniciar,
}: {
  participantes: ParticipanteT[];
  iniciar: (orden: string[], pin: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<
    "elegir" | "manual" | "aleatorio" | "ruleta"
  >("elegir");
  const [orden, setOrden] = useState<ParticipanteT[]>(participantes);
  const [barajando, setBarajando] = useState(false);
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  // Drag-and-drop del modo manual.
  const listaRef = useRef<HTMLUListElement>(null);
  const dragIndex = useRef<number | null>(null);
  const [arrastrando, setArrastrando] = useState<number | null>(null);

  useEffect(() => {
    if (!abierto) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  // Animación de sorteo: baraja rápido y se detiene en un orden final.
  useEffect(() => {
    if (!barajando) return;
    const iv = setInterval(() => setOrden((o) => shuffle(o)), 90);
    const to = setTimeout(() => setBarajando(false), 1600);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [barajando]);

  function cerrar() {
    setAbierto(false);
    setModo("elegir");
    setOrden(participantes);
    setPin("");
    setError("");
  }

  function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= orden.length) return;
    const a = [...orden];
    [a[i], a[j]] = [a[j], a[i]];
    setOrden(a);
  }

  // Arrastrar para reordenar (touch + mouse): el número se actualiza en vivo.
  function iniciarArrastre(e: React.PointerEvent, i: number) {
    dragIndex.current = i;
    setArrastrando(i);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function moverArrastre(e: React.PointerEvent) {
    const desde = dragIndex.current;
    const cont = listaRef.current;
    if (desde === null || !cont) return;
    const n = cont.children.length;
    if (!n) return;
    const rect = cont.getBoundingClientRect();
    const rel = e.clientY - rect.top;
    let destino = Math.floor(rel / (rect.height / n));
    destino = Math.max(0, Math.min(n - 1, destino));
    if (destino !== desde) {
      setOrden((o) => {
        const a = [...o];
        const [m] = a.splice(desde, 1);
        a.splice(destino, 0, m);
        return a;
      });
      dragIndex.current = destino;
      setArrastrando(destino);
    }
  }
  function terminarArrastre() {
    dragIndex.current = null;
    setArrastrando(null);
  }

  async function confirmar() {
    setEnviando(true);
    setError("");
    const res = await iniciar(
      orden.map((p) => p.id),
      pin,
    );
    setEnviando(false);
    if (res?.error) setError(res.error);
    else {
      cerrar();
      router.refresh();
    }
  }

  const listo = modo === "manual" || (modo === "aleatorio" && !barajando);

  return (
    <>
      <Button type="button" className="w-full" onClick={() => setAbierto(true)}>
        <Play className="size-4" /> Iniciar san
      </Button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            aria-hidden="true"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) cerrar();
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl border bg-card p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Iniciar el san</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrar}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {modo === "elegir" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  ¿Cómo quieres asignar el orden de turnos?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOrden(participantes);
                    setModo("manual");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/60"
                >
                  <Hand className="size-5 text-brand" />
                  <span>
                    <span className="block text-sm font-medium">Manual (a dedo)</span>
                    <span className="block text-xs text-muted-foreground">
                      Tú decides el orden.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModo("aleatorio");
                    setBarajando(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/60"
                >
                  <Shuffle className="size-5 text-brand" />
                  <span>
                    <span className="block text-sm font-medium">
                      Aleatorio rápido y visual
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Baraja al instante; sortea las veces que quieras hasta que te
                      guste.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setModo("ruleta")}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/60"
                >
                  <Sparkles className="size-5 text-brand" />
                  <span>
                    <span className="block text-sm font-medium">Ruleta 🎰</span>
                    <span className="block text-xs text-muted-foreground">
                      Sorteo con animación y sonido, turno por turno. El resultado es
                      definitivo.
                    </span>
                  </span>
                </button>
              </div>
            ) : modo === "ruleta" ? (
              <RuletaSorteo participantes={participantes} iniciar={iniciar} />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Orden de turnos</p>
                  {modo === "aleatorio" && (
                    <button
                      type="button"
                      onClick={() => setBarajando(true)}
                      disabled={barajando}
                      className="flex items-center gap-1 text-xs text-brand disabled:opacity-50"
                    >
                      <Shuffle className="size-3.5" /> Sortear de nuevo
                    </button>
                  )}
                </div>

                <ul ref={listaRef} className="space-y-1.5">
                  {orden.map((p, i) => (
                    <li
                      key={p.id}
                      className={`flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-all ${
                        barajando ? "opacity-70" : ""
                      } ${arrastrando === i ? "ring-2 ring-brand" : ""}`}
                    >
                      {modo === "manual" && (
                        <button
                          type="button"
                          aria-label="Arrastrar para reordenar"
                          onPointerDown={(e) => iniciarArrastre(e, i)}
                          onPointerMove={moverArrastre}
                          onPointerUp={terminarArrastre}
                          onPointerCancel={terminarArrastre}
                          style={{ touchAction: "none" }}
                          className="-ml-1 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
                        >
                          <GripVertical className="size-4" />
                        </button>
                      )}
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {nombreDe(p)}
                        {p.esOrganizador && (
                          <span className="ml-1 text-[10px] font-semibold text-gold">
                            Organizador
                          </span>
                        )}
                      </span>
                      {modo === "manual" && (
                        <span className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            aria-label="Subir"
                            onClick={() => mover(i, -1)}
                            disabled={i === 0}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Bajar"
                            onClick={() => mover(i, 1)}
                            disabled={i === orden.length - 1}
                            className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                          >
                            <ArrowDown className="size-4" />
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {listo && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Al iniciar, a todos les llegará su turno. Confirma con tu PIN.
                    </p>
                    <CampoPin onChange={setPin} testId="iniciar-pin" />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button
                      type="button"
                      className="w-full"
                      onClick={confirmar}
                      disabled={enviando || barajando || !/^\d{6}$/.test(pin)}
                    >
                      {enviando ? "Iniciando..." : "Iniciar san"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setModo("elegir");
                        setError("");
                      }}
                      className="w-full text-center text-xs text-muted-foreground"
                    >
                      Volver
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
