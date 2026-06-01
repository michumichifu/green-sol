"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export type Caja = { left: number; top: number; width: number; height: number };

/**
 * Devuelve la caja (posición/tamaño) del elemento con `data-activo="true"`
 * dentro del contenedor, para deslizar un indicador con transición.
 * `dep` re-mide al cambiar (la selección activa).
 */
export function useIndicador(dep: unknown): {
  ref: RefObject<HTMLDivElement | null>;
  caja: Caja | null;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState<Caja | null>(null);

  useEffect(() => {
    const medir = () => {
      const cont = ref.current;
      if (!cont) return;
      const el = cont.querySelector<HTMLElement>('[data-activo="true"]');
      if (el) {
        setCaja({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      }
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);

  return { ref, caja };
}
