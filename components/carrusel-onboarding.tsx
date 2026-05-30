"use client";

import { useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cerrarOnboarding } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Tarjeta = { img: string; titulo: string; texto: string };

const TARJETAS: Tarjeta[] = [
  {
    img: "/onboarding-1-intro.svg",
    titulo: "¿Cómo funciona Green Sol?",
    texto:
      "Una plataforma para llevar tus métodos de ahorro —solo o en grupo— de forma fácil, rápida y transparente.",
  },
  {
    img: "/onboarding-2-san.svg",
    titulo: "San, susi o bolso — por turnos",
    texto:
      "Todos aportan por turno y, por turno, a cada quien le toca recibir el bote completo. Ahorro disciplinado: es el corazón de la app.",
  },
  {
    img: "/onboarding-3-vaca.svg",
    titulo: "Vaca o pote — meta común",
    texto:
      "Juntan dinero hacia una meta y luego se gasta o reparte. Sin turnos.",
  },
  {
    img: "/onboarding-4-dividir.svg",
    titulo: "Dividir una cuenta",
    texto: "Reparten un gasto entre varios; cada quien ve cuánto le toca.",
  },
  {
    img: "/onboarding-5-calculadora.svg",
    titulo: "Calculadora",
    texto: "Convierte entre Bs, USDC y SOL con las tasas del día.",
  },
];

export function CarruselOnboarding() {
  const [indice, setIndice] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [noMostrar, setNoMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function irA(i: number) {
    const cont = scrollRef.current;
    if (!cont) return;
    cont.scrollTo({ left: i * cont.clientWidth, behavior: "smooth" });
    setIndice(i);
  }

  function onScroll() {
    const cont = scrollRef.current;
    if (!cont) return;
    setIndice(Math.round(cont.scrollLeft / cont.clientWidth));
  }

  // Muestra la pantalla de carga (logo que cae y gira) y luego cierra.
  async function finalizar(noMostrarMas: boolean) {
    setConfirmando(false);
    setCargando(true);
    await new Promise((r) => setTimeout(r, 2500));
    await cerrarOnboarding(noMostrarMas);
  }

  const ultima = indice === TARJETAS.length - 1;

  if (cargando) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-gradient-to-br from-[#075c43] to-[#14b078]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/green-sol-logo.svg"
          alt="Green Sol"
          className="size-28 drop-shadow-xl"
          style={{ animation: "greensol-entrada 2.4s ease-out both" }}
        />
        <p className="mt-8 text-sm font-medium text-white/80">Preparando todo…</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col bg-gradient-to-br from-[#075c43] to-[#14b078] text-white">
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label="Cerrar introductorio"
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
      >
        <X className="size-5" />
      </button>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scrollbar-hide flex flex-1 snap-x snap-mandatory overflow-x-auto"
      >
        {TARJETAS.map((t, i) => (
          <section
            key={i}
            className="flex w-full shrink-0 snap-center flex-col items-center justify-center gap-5 px-8 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.img}
              alt=""
              className="h-52 w-52 object-contain drop-shadow-xl sm:h-60 sm:w-60"
              style={
                i === 0
                  ? { animation: "greensol-drop 0.7s ease-out both" }
                  : undefined
              }
            />
            <h2 className="text-2xl font-bold sm:text-3xl">{t.titulo}</h2>
            <p className="max-w-sm text-base leading-relaxed text-white/90">
              {t.texto}
            </p>
            {i === TARJETAS.length - 1 && (
              <Button
                type="button"
                size="lg"
                onClick={() => finalizar(false)}
                className="bg-white text-brand hover:bg-white/90"
              >
                Empezar
              </Button>
            )}
          </section>
        ))}
      </div>

      <div className="grid grid-cols-3 items-center px-6 pb-8 pt-2">
        <div className="justify-self-start">
          {indice > 0 && (
            <button
              type="button"
              onClick={() => irA(indice - 1)}
              className="flex items-center gap-1 text-sm font-medium"
            >
              <ChevronLeft className="size-4" /> Anterior
            </button>
          )}
        </div>
        <div className="flex justify-center gap-2">
          {TARJETAS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ir a la tarjeta ${i + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                i === indice ? "w-6 bg-white" : "w-2 bg-white/40",
              )}
            />
          ))}
        </div>
        <div className="justify-self-end">
          {!ultima && (
            <button
              type="button"
              onClick={() => irA(indice + 1)}
              className="flex items-center gap-1 text-sm font-medium"
            >
              Siguiente <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      {confirmando && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 text-center text-foreground">
            <p className="text-lg font-semibold">¿Saltar el introductorio?</p>
            <p className="text-sm text-muted-foreground">
              Es rápido y te ayuda a entender la app. Puedes saltarlo si ya la
              conoces.
            </p>

            <button
              type="button"
              onClick={() => setNoMostrar((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-xl border bg-muted/40 p-3 text-left text-sm"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  noMostrar
                    ? "border-brand bg-brand text-white"
                    : "border-muted-foreground/40",
                )}
              >
                {noMostrar && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              No volver a mostrar más
            </button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmando(false)}
              >
                Seguir viendo
              </Button>
              <Button
                className="flex-1"
                onClick={() => finalizar(noMostrar)}
              >
                Saltar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
