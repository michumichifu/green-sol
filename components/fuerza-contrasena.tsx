"use client";

/**
 * Medidor de fuerza de la contraseña: barra de 3 segmentos que se llena de
 * izquierda a derecha. Débil = rojo, media = naranja, fuerte = verde de marca.
 */
function evaluar(pw: string): {
  pct: number;
  barra: string;
  texto: string;
  etiqueta: string;
} {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length >= 12) s++;

  if (s <= 2)
    return {
      pct: 30,
      barra: "bg-red-500",
      texto: "text-red-500",
      etiqueta: "Débil",
    };
  if (s === 3)
    return {
      pct: 60,
      barra: "bg-orange-500",
      texto: "text-orange-500",
      etiqueta: "Media",
    };
  if (s === 4)
    return {
      pct: 84,
      barra: "bg-brand",
      texto: "text-brand",
      etiqueta: "Fuerte",
    };
  return {
    pct: 100,
    barra: "bg-brand",
    texto: "text-brand",
    etiqueta: "Muy fuerte",
  };
}

export function FuerzaContrasena({ value }: { value: string }) {
  if (!value) return null;
  const { pct, barra, texto, etiqueta } = evaluar(value);

  return (
    <div className="space-y-1">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => {
          const fill = Math.max(0, Math.min(1, (pct / 100) * 3 - i)) * 100;
          return (
            <span
              key={i}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <span
                className={`block h-full rounded-full transition-all duration-300 ${barra}`}
                style={{ width: `${fill}%` }}
              />
            </span>
          );
        })}
      </div>
      <p className={`text-right text-xs ${texto}`}>{etiqueta}</p>
    </div>
  );
}
