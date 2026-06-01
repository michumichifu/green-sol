import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

/**
 * Aviso discreto (ámbar) que invita a completar la verificación. Se muestra
 * mientras al usuario le falte el paso básico (agregar un método de 2FA).
 */
export function BannerVerificacion({
  completo,
  className = "",
}: {
  completo: boolean;
  className?: string;
}) {
  if (completo) return null;
  return (
    <Link
      href="/configuracion?tab=verificacion"
      className={`flex items-center gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2.5 transition-colors hover:bg-gold/15 ${className}`}
    >
      <ShieldAlert className="size-4 shrink-0 text-gold" />
      <span className="flex-1 text-[13px] font-medium leading-tight">
        Completa tu verificación — agrega un método de seguridad.
      </span>
      <ArrowRight className="size-4 shrink-0 text-gold" />
    </Link>
  );
}
