"use client";

import { useActionState, useState } from "react";
import {
  RefreshCw,
  Target,
  Lock,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { crearRecolecta, type EstadoRecolecta } from "../actions";
import {
  MONEDAS_RECOLECTA,
  MONEDA_RECOLECTA,
  FRECUENCIAS,
  FRECUENCIA_LABEL,
} from "@/lib/validations/recolecta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOTAL = 6;

export default function CrearPage() {
  const [estado, accion, pendiente] = useActionState<EstadoRecolecta, FormData>(
    crearRecolecta,
    {},
  );

  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<"" | "san" | "vaca">("");
  const [nombre, setNombre] = useState("");
  const [visibilidad, setVisibilidad] = useState<"privado" | "publico">(
    "privado",
  );
  const [moneda, setMoneda] = useState("");
  const [monto, setMonto] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [cupo, setCupo] = useState("");

  const esSan = tipo === "san";
  const simbolo = moneda ? MONEDA_RECOLECTA[moneda]?.simbolo : "";

  const puedeSeguir = (() => {
    switch (paso) {
      case 0:
        return tipo !== "";
      case 1:
        return nombre.trim().length >= 2;
      case 2:
        return true;
      case 3:
        return moneda !== "";
      case 4:
        return (
          Number(monto) > 0 &&
          (!esSan || (frecuencia !== "" && Number(cupo) >= 2))
        );
      default:
        return true;
    }
  })();

  const Chip = ({
    activo,
    onClick,
    children,
  }: {
    activo: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-sm transition-colors",
        activo ? "border-brand bg-brand/5 text-brand" : "hover:border-brand/40",
      )}
    >
      {children}
    </button>
  );

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-5 py-5">
      {/* Encabezado + progreso */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          {paso > 0 ? (
            <button
              type="button"
              onClick={() => setPaso((p) => p - 1)}
              aria-label="Atrás"
              className="text-muted-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <h1 className="text-lg font-bold">Crear ahorro</h1>
          <span className="ml-auto text-xs text-muted-foreground">
            Paso {paso + 1} de {TOTAL}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((paso + 1) / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4">
          {/* Paso 0: tipo */}
          {paso === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                ¿Qué tipo de ahorro quieres crear?
              </p>
              <button
                type="button"
                onClick={() => setTipo("san")}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  esSan ? "border-brand bg-brand/5" : "hover:border-brand/40",
                )}
              >
                <RefreshCw className="mt-0.5 size-5 shrink-0 text-brand" />
                <span>
                  <span className="block font-semibold">
                    Susi · San · Bolso{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (por turnos)
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Cada ronda todos aportan a la vez; lo que rota es el cobro:
                    por turno, a una persona le toca el bote completo.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipo("vaca")}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  tipo === "vaca"
                    ? "border-brand bg-brand/5"
                    : "hover:border-brand/40",
                )}
              >
                <Target className="mt-0.5 size-5 shrink-0 text-gold" />
                <span>
                  <span className="block font-semibold">
                    Vaca · Pote{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (meta común)
                    </span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Aportan para reunir entre todas y lograr un objetivo o meta
                    común.
                  </span>
                </span>
              </button>
            </div>
          )}

          {/* Paso 1: nombre */}
          {paso === 1 && (
            <div className="space-y-2">
              <label htmlFor="nombre-v" className="text-sm font-medium">
                ¿Cómo se llama?
              </label>
              <Input
                id="nombre-v"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={esSan ? "Ej: San de la oficina" : "Ej: Viaje a la playa"}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Un nombre claro para que todos lo reconozcan.
              </p>
            </div>
          )}

          {/* Paso 2: visibilidad */}
          {paso === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">¿Quién puede verlo?</p>
              <div className="grid grid-cols-2 gap-2">
                <Chip
                  activo={visibilidad === "privado"}
                  onClick={() => setVisibilidad("privado")}
                >
                  <Lock className="mx-auto mb-1 size-5" />
                  Privado
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Solo con invitación
                  </span>
                </Chip>
                <Chip
                  activo={visibilidad === "publico"}
                  onClick={() => setVisibilidad("publico")}
                >
                  <Globe className="mx-auto mb-1 size-5" />
                  Público
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    Cualquiera puede unirse
                  </span>
                </Chip>
              </div>
            </div>
          )}

          {/* Paso 3: moneda */}
          {paso === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">¿En qué moneda?</p>
              <div className="space-y-2">
                {MONEDAS_RECOLECTA.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoneda(m)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      moneda === m
                        ? "border-brand bg-brand/5"
                        : "hover:border-brand/40",
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-bold">
                      {MONEDA_RECOLECTA[m].simbolo}
                    </span>
                    <span className="text-sm font-medium">
                      {MONEDA_RECOLECTA[m].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paso 4: detalles según tipo */}
          {paso === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="monto-v" className="text-sm font-medium">
                  {esSan ? "Aporte por turno" : "Meta a juntar"}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-brand">
                    {simbolo}
                  </span>
                  <Input
                    id="monto-v"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className={simbolo.length > 2 ? "pl-14" : "pl-10"}
                  />
                </div>
              </div>

              {esSan && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">¿Cada cuánto se aporta?</p>
                    <div className="grid grid-cols-3 gap-2">
                      {FRECUENCIAS.map((f) => (
                        <Chip
                          key={f}
                          activo={frecuencia === f}
                          onClick={() => setFrecuencia(f)}
                        >
                          {FRECUENCIA_LABEL[f]}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="cupo-v" className="text-sm font-medium">
                      ¿Cuántas manos (personas)?
                    </label>
                    <Input
                      id="cupo-v"
                      type="number"
                      inputMode="numeric"
                      min="2"
                      max="50"
                      value={cupo}
                      onChange={(e) => setCupo(e.target.value)}
                      placeholder="Ej: 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Determina cuántos turnos habrá.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Paso 5: resumen */}
          {paso === 5 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Revisa y confirma</p>
              <dl className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
                <Resumen
                  k="Tipo"
                  v={esSan ? "Susi · San · Bolso (turnos)" : "Vaca · Pote (meta)"}
                />
                <Resumen k="Nombre" v={nombre} />
                <Resumen
                  k="Visibilidad"
                  v={visibilidad === "privado" ? "Privado" : "Público"}
                />
                <Resumen
                  k="Moneda"
                  v={moneda ? MONEDA_RECOLECTA[moneda].label : ""}
                />
                <Resumen
                  k={esSan ? "Aporte por turno" : "Meta"}
                  v={`${simbolo} ${monto}`}
                />
                {esSan && (
                  <>
                    <Resumen
                      k="Frecuencia"
                      v={frecuencia ? FRECUENCIA_LABEL[frecuencia] : ""}
                    />
                    <Resumen k="Manos" v={`${cupo} personas`} />
                  </>
                )}
              </dl>
              {estado.error && (
                <p className="text-sm text-destructive">{estado.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-6">
          {paso < TOTAL - 1 ? (
            <Button
              type="button"
              className="w-full"
              disabled={!puedeSeguir}
              onClick={() => setPaso((p) => p + 1)}
            >
              Siguiente <ArrowRight className="size-4" />
            </Button>
          ) : (
            <form action={accion}>
              <input type="hidden" name="tipo" value={tipo} />
              <input type="hidden" name="nombre" value={nombre} />
              <input type="hidden" name="visibilidad" value={visibilidad} />
              <input type="hidden" name="moneda" value={moneda} />
              <input type="hidden" name="monto" value={monto} />
              <input
                type="hidden"
                name="frecuencia"
                value={esSan ? frecuencia : ""}
              />
              <input
                type="hidden"
                name="cupoMiembros"
                value={esSan ? cupo : ""}
              />
              <Button type="submit" className="w-full" disabled={pendiente}>
                <Check className="size-4" />{" "}
                {pendiente ? "Creando..." : "Crear ahorro"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function Resumen({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
