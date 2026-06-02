"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface CampoPinProps {
  onChange: (pin: string) => void;
  onCompleto?: () => void;
  autoFocus?: boolean;
  oculto?: boolean;
  id?: string;
  name?: string;
  testId?: string;
}

export type CampoPinHandle = { reset: () => void };

export const CampoPin = forwardRef<CampoPinHandle, CampoPinProps>(function CampoPin({
  onChange,
  onCompleto,
  autoFocus = false,
  oculto = true,
  id,
  name,
  testId = "pin",
}, ref) {
  const refs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));
  const digitos = useRef<string[]>(Array(6).fill(""));
  const completado = useRef(false);

  useImperativeHandle(ref, () => ({
    reset() {
      digitos.current = Array(6).fill("");
      for (let i = 0; i < 6; i++) {
        if (refs.current[i]) refs.current[i]!.value = "";
      }
      completado.current = false;
      onChange("");
      refs.current[0]?.focus();
    },
  }));

  useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus();
    }
  }, [autoFocus]);

  function notificar() {
    const pin = digitos.current.join("");
    onChange(pin);
    const estaCompleto = digitos.current.every((d) => d !== "");
    if (estaCompleto) {
      if (!completado.current) {
        completado.current = true;
        onCompleto?.();
      }
    } else {
      completado.current = false;
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
  ) {
    const raw = e.target.value;
    // Toma solo el último carácter ingresado (por si el browser no bloqueó)
    const digito = raw.replace(/\D/g, "").slice(-1);

    digitos.current[idx] = digito;
    // Fuerza el valor visible al dígito limpio
    e.target.value = digito;

    if (digito && idx < 5) {
      refs.current[idx + 1]?.focus();
    }

    notificar();
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number,
  ) {
    if (e.key === "Backspace") {
      if (digitos.current[idx]) {
        // Borra el dígito actual sin retroceder el foco
        digitos.current[idx] = "";
        if (refs.current[idx]) refs.current[idx]!.value = "";
        notificar();
      } else if (idx > 0) {
        // Casilla ya vacía → va a la anterior y la borra
        digitos.current[idx - 1] = "";
        const prevInput = refs.current[idx - 1];
        if (prevInput) {
          prevInput.value = "";
          prevInput.focus();
        }
        notificar();
      }
      e.preventDefault();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const texto = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!texto) return;
    e.preventDefault();

    texto.split("").forEach((d, i) => {
      digitos.current[i] = d;
      if (refs.current[i]) refs.current[i]!.value = d;
    });
    // Limpia las casillas restantes si el pegado fue menor a 6
    for (let i = texto.length; i < 6; i++) {
      digitos.current[i] = "";
      if (refs.current[i]) refs.current[i]!.value = "";
    }

    const siguienteFoco = Math.min(texto.length, 5);
    refs.current[siguienteFoco]?.focus();

    notificar();
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    // Selecciona el contenido para facilitar reemplazo
    e.target.select();
  }

  return (
    <div
      role="group"
      aria-label="PIN de 6 dígitos"
      id={id}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: 6 }, (_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            refs.current[idx] = el;
          }}
          type={oculto ? "password" : "text"}
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          autoComplete="one-time-code"
          name={name ? `${name}-${idx}` : undefined}
          data-testid={`${testId}-${idx}`}
          aria-label={`Dígito ${idx + 1} de 6`}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          className={[
            // Tamaño: grande para uso en móvil retail
            "h-12 w-11 rounded-xl border-2 bg-muted/50 text-center text-xl font-bold",
            // Sombra sutil y transición suave
            "shadow-sm transition-all duration-150",
            // Borde normal
            "border-input",
            // Outline reemplazado por borde de marca al enfocar
            "outline-none",
            "focus:border-brand focus:bg-background focus:ring-3 focus:ring-brand/20",
          ].join(" ")}
        />
      ))}
    </div>
  );
});
