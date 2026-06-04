"use client";

import { useRef, useState } from "react";
import { CampoPin } from "@/components/campo-pin";
import { Button } from "@/components/ui/button";
import { tick, ganador } from "@/lib/san/sonidos-ruleta";

type ParticipanteT = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  esOrganizador: boolean;
};

// Primer nombre + primer apellido (para los gajos de la ruleta).
function nombreApellido(p: ParticipanteT) {
  const n = (p.nombre ?? "").split(" ")[0];
  const a = (p.apellido ?? "").split(" ")[0];
  return [n, a].filter(Boolean).join(" ") || (p.nombreUsuario ? `@${p.nombreUsuario}` : "—");
}

// Para los resultados: "@usuario (Nombre Apellido)".
function etiqueta(p: ParticipanteT) {
  const nombre = [p.nombre, p.apellido].filter(Boolean).join(" ");
  if (p.nombreUsuario) return nombre ? `@${p.nombreUsuario} (${nombre})` : `@${p.nombreUsuario}`;
  return nombre || "Participante";
}

const PALETA = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const CX = 120;
const CY = 120;
const R = 110;

function sectorPath(startRad: number, endRad: number) {
  const x1 = CX + R * Math.cos(startRad);
  const y1 = CY + R * Math.sin(startRad);
  const x2 = CX + R * Math.cos(endRad);
  const y2 = CY + R * Math.sin(endRad);
  const large = endRad - startRad > Math.PI ? 1 : 0;
  return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
}

/**
 * Sorteo tipo casino: gira la ruleta y revela el orden de turnos uno por uno.
 * No se puede rehacer; al completar el orden se confirma el inicio con PIN.
 */
export function RuletaSorteo({
  participantes,
  iniciar,
}: {
  participantes: ParticipanteT[];
  iniciar: (orden: string[], pin: string) => Promise<{ error?: string }>;
}) {
  const [restantes, setRestantes] = useState<ParticipanteT[]>(participantes);
  const [orden, setOrden] = useState<ParticipanteT[]>([]);
  const [rot, setRot] = useState(0);
  const [girando, setGirando] = useState(false);
  const [pin, setPin] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const rotRef = useRef(0);

  const completo = restantes.length === 0;
  const n = restantes.length;
  const segDeg = n > 0 ? 360 / n : 0;
  const segRad = (segDeg * Math.PI) / 180;
  // Segmentos dibujados desde arriba (12 en punto = -90°).
  const base = -Math.PI / 2;

  function asignar(ganadorIdx: number) {
    const elegido = restantes[ganadorIdx];
    const quedan = restantes.filter((_, i) => i !== ganadorIdx);
    if (quedan.length === 1) {
      // Si solo queda uno, es el último turno: se asigna automáticamente.
      const ultimo = quedan[0];
      setOrden((o) => [...o, elegido, ultimo]);
      setRestantes([]);
    } else {
      setOrden((o) => [...o, elegido]);
      setRestantes(quedan);
    }
  }

  function girar() {
    if (girando || n === 0) return;
    const g = Math.floor(Math.random() * n);
    const vueltas = 5;
    const inicio = rotRef.current;
    // Para que el centro del segmento g quede arriba (bajo el puntero).
    const objetivo = 360 * vueltas + (360 - (g + 0.5) * segDeg);
    const dur = 3400;
    const t0 = performance.now();
    let lastIdx = -1;
    setGirando(true);
    setError("");

    function frame(now: number) {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3); // ease-out: desacelera al final
      const cur = inicio + objetivo * e;
      rotRef.current = cur;
      setRot(cur);
      const idx = ((Math.floor(-cur / segDeg) % n) + n) % n;
      if (idx !== lastIdx) {
        lastIdx = idx;
        tick();
      }
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        setGirando(false);
        ganador();
        asignar(g);
      }
    }
    requestAnimationFrame(frame);
  }

  async function confirmar() {
    setEnviando(true);
    setError("");
    const res = await iniciar(orden.map((p) => p.id), pin);
    setEnviando(false);
    if (res?.error) setError(res.error);
    // si ok, la acción revalida y el modal lo cierra el padre vía router.refresh
  }

  return (
    <div className="space-y-3">
      {!completo ? (
        <>
          <p className="text-center text-xs text-muted-foreground">
            Gira para revelar el turno {orden.length + 1}. No se puede rehacer.
          </p>

          {/* Ruleta */}
          <div className="relative mx-auto w-[240px]">
            {/* Puntero */}
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
              <div className="size-0 border-x-8 border-t-[14px] border-x-transparent border-t-foreground" />
            </div>
            <svg
              viewBox="0 0 240 240"
              className="w-full"
              style={{
                transform: `rotate(${rot}deg)`,
                transition: girando ? "none" : "transform 0.1s",
              }}
            >
              {restantes.map((p, i) => {
                const a0 = base + i * segRad;
                const a1 = base + (i + 1) * segRad;
                const mid = (a0 + a1) / 2;
                const tx = CX + R * 0.62 * Math.cos(mid);
                const ty = CY + R * 0.62 * Math.sin(mid);
                const deg = (mid * 180) / Math.PI;
                return (
                  <g key={p.id}>
                    <path d={sectorPath(a0, a1)} fill={PALETA[i % PALETA.length]} />
                    <text
                      x={tx}
                      y={ty}
                      fill="#fff"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${deg} ${tx} ${ty})`}
                    >
                      <tspan x={tx} dy="-0.2em" fontSize="10" fontWeight="700">
                        {nombreApellido(p)}
                      </tspan>
                      {p.nombreUsuario && (
                        <tspan x={tx} dy="1.1em" fontSize="8" fontWeight="500" opacity="0.9">
                          @{p.nombreUsuario}
                        </tspan>
                      )}
                    </text>
                  </g>
                );
              })}
              <circle cx={CX} cy={CY} r="16" fill="#fff" stroke="#0001" />
            </svg>
          </div>

          {orden.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Ya salieron: {orden.map((p, i) => `${i + 1}. ${etiqueta(p)}`).join(" · ")}
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            onClick={girar}
            disabled={girando}
          >
            {girando ? "Girando…" : "Girar 🎰"}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Orden definitivo</p>
          <ul className="space-y-1.5">
            {orden.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                  {i + 1}
                </span>
                <span className="truncate text-sm">
                  {etiqueta(p)}
                  {p.esOrganizador && (
                    <span className="ml-1 text-[10px] font-semibold text-gold">
                      Organizador
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Este orden es definitivo. Confirma con tu PIN para iniciar el san.
            </p>
            <CampoPin onChange={setPin} testId="ruleta-pin" />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="button"
              className="w-full"
              onClick={confirmar}
              disabled={enviando || !/^\d{6}$/.test(pin)}
            >
              {enviando ? "Iniciando…" : "Iniciar san con este orden"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
