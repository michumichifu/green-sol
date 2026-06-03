import Link from "next/link";
import { Users, LinkIcon, LogIn } from "lucide-react";
import { infoInvitacion } from "@/app/(app)/sanes/actions";
import { obtenerUsuario } from "@/lib/auth/session";
import { perfilVerificado } from "@/lib/perfil-verificado";
import { buttonVariants } from "@/components/ui/button";
import { ConfirmarUnion } from "@/components/san/confirmar-union";

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const info = await infoInvitacion(codigo);
  const usuario = await obtenerUsuario();

  if (info.error || !info.san) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8">
        <div className="space-y-3 rounded-2xl border bg-card p-6 text-center shadow-sm">
          <LinkIcon className="mx-auto size-8 text-muted-foreground" />
          <p className="font-semibold">Enlace no válido</p>
          <p className="text-sm text-muted-foreground">
            {info.error ?? "Este enlace de invitación ya no es válido."}
          </p>
          <Link
            href="/sanes"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Ir a mis ahorros
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8">
      <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Users className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Te invitaron a un san</p>
            <p className="truncate text-lg font-bold">{info.san.nombre}</p>
          </div>
        </div>

        {!usuario ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Inicia sesión para solicitar unirte a este ahorro.
            </p>
            <Link
              href={`/login?next=/i/${codigo}`}
              className={buttonVariants({ className: "w-full" })}
            >
              <LogIn className="size-4" /> Iniciar sesión
            </Link>
          </div>
        ) : (
          <ConfirmarUnion
            codigo={codigo}
            verificado={perfilVerificado(usuario)}
            modo="solicitar"
            etiquetaBoton="Solicitar unirse"
          />
        )}
      </div>
    </main>
  );
}
