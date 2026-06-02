interface DonaProgresoProps {
  pagados: number;
  total: number;
  label?: string;
}

/**
 * Dona de progreso SVG pura (server-compatible, sin estado).
 *
 * viewBox 36×36, radio del anillo = 15.9155 → circunferencia = 2π·r ≈ 100.
 * stroke-dasharray = 100, stroke-dashoffset = 100 - porcentaje
 * → offset 0 = lleno, offset 100 = vacío.
 */
export function DonaProgreso({ pagados, total, label }: DonaProgresoProps) {
  // Clamp defensivo: 0 ≤ pct ≤ 100
  const pct = total === 0 ? 0 : Math.min(100, Math.round((pagados / total) * 100));

  // r elegido para que 2πr = 100 (simplifica el cálculo del offset)
  const r = 15.9155;
  const circunferencia = 100; // 2 * π * r ≈ 100 (exacto por diseño del radio)
  const offset = circunferencia - pct;

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Contenedor relativo para superponer el texto en el centro */}
      <div className="relative inline-flex items-center justify-center">
        <svg
          width="96"
          height="96"
          viewBox="0 0 36 36"
          aria-label={`${pagados} de ${total} pagados`}
          role="img"
        >
          {/* Anillo de fondo */}
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="#eef1ef"
            strokeWidth="3.5"
          />
          {/* Arco de progreso */}
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke="#14c98a"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${circunferencia} ${circunferencia}`}
            strokeDashoffset={offset}
            transform="rotate(-90 18 18)"
          />
        </svg>

        {/* Texto centrado encima del SVG */}
        <div className="absolute flex flex-col items-center leading-none">
          <span className="text-sm font-bold tabular-nums">
            {pagados}/{total}
          </span>
        </div>
      </div>

      {/* Label opcional debajo de la dona */}
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
