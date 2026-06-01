import type { ElementType } from "react";

/**
 * Tratamiento tipográfico de marca para el nombre "Green Sol"
 * (mayúsculas + tracking). Provisional, hasta fijar el sistema de marca.
 */
export function Wordmark({
  as,
  size = "sm",
  className = "",
}: {
  as?: ElementType;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Tag = as ?? "span";
  const sz =
    size === "lg"
      ? "text-3xl sm:text-4xl tracking-[0.25em]"
      : size === "md"
        ? "text-xl tracking-[0.28em]"
        : "text-xs tracking-[0.22em]";
  return (
    <Tag className={`font-semibold uppercase ${sz} ${className}`}>Green Sol</Tag>
  );
}
