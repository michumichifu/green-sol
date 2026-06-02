import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthShell, BOTON_DEGRADADO } from "@/components/auth-shell";

export default function RegistroCompletoPage() {
  return (
    <AuthShell
      variante="registro"
      titulo="¡Tu cuenta está lista!"
      subtitulo="Ya puedes entrar a Green Sol"
      header={<span />}
    >
      <div className="space-y-6 text-center">
        {/* Ícono de éxito */}
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand/10">
            <CheckCircle2 className="size-10 text-brand" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Verificaste tu correo y creaste tu PIN. ¡Estás listo para empezar a
          ahorrar en grupo con Green Sol!
        </p>

        <Link
          href="/login"
          className={BOTON_DEGRADADO + " inline-flex items-center justify-center"}
        >
          Iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}
