"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function PanelTabs({
  tabs,
  children,
  inicial = 0,
  variante = "pill",
}: {
  tabs: string[];
  children: ReactNode;
  inicial?: number;
  variante?: "pill" | "sub";
}) {
  const [activo, setActivo] = useState(inicial);
  // Sincroniza con la pestaña pedida por URL (?tab=) al navegar a la misma página.
  useEffect(() => {
    setActivo(inicial);
  }, [inicial]);
  const secciones = Children.toArray(children);

  const esSub = variante === "sub";
  const barRef = useRef<HTMLDivElement>(null);
  const [indic, setIndic] = useState<{ left: number; width: number } | null>(
    null,
  );

  // Mide la posición del botón activo para deslizar el indicador.
  useEffect(() => {
    const medir = () => {
      const bar = barRef.current;
      if (!bar) return;
      const btn =
        bar.querySelectorAll<HTMLButtonElement>("[data-tab]")[activo];
      if (btn) setIndic({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [activo]);

  return (
    <div>
      <div
        ref={barRef}
        className={cn(
          "relative mb-5 flex gap-1 overflow-x-auto scrollbar-hide",
          esSub ? "mb-4 border-b" : "rounded-xl bg-muted p-1",
        )}
      >
        {indic &&
          (esSub ? (
            <span
              className="pointer-events-none absolute bottom-0 h-0.5 rounded bg-brand transition-all duration-300 ease-out"
              style={{ left: indic.left, width: indic.width }}
            />
          ) : (
            <span
              className="pointer-events-none absolute top-1 bottom-1 rounded-lg bg-card shadow-sm transition-all duration-300 ease-out"
              style={{ left: indic.left, width: indic.width }}
            />
          ))}

        {tabs.map((t, i) => (
          <button
            key={t}
            data-tab
            type="button"
            onClick={() => setActivo(i)}
            className={cn(
              "whitespace-nowrap text-sm font-medium transition-colors",
              esSub
                ? "-mb-px flex-none border-b-2 border-transparent px-3 py-2"
                : "relative z-10 flex-none rounded-lg px-3 py-2 sm:flex-1",
              activo === i
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div
        key={activo}
        className="animate-in fade-in slide-in-from-right-2 duration-300"
      >
        {secciones[activo]}
      </div>
    </div>
  );
}
