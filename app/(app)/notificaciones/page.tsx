import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { marcarTodasLeidas } from "./actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default async function NotificacionesPage() {
  const usuario = await obtenerUsuario();
  const notis = await prisma.notificacion.findMany({
    where: { usuarioId: usuario!.id },
    orderBy: { creadaEn: "desc" },
    take: 50,
  });
  const hayNoLeidas = notis.some((n) => !n.leida);

  return (
    <main className="mx-auto max-w-md space-y-4 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avisos</h1>
        {hayNoLeidas && (
          <form action={marcarTodasLeidas}>
            <Button type="submit" variant="ghost" size="sm">
              Marcar leídas
            </Button>
          </form>
        )}
      </div>
      {notis.length === 0 && (
        <p className="text-sm text-muted-foreground">No tienes avisos.</p>
      )}
      <ul className="space-y-2">
        {notis.map((n) => (
          <li
            key={n.id}
            className={cn(
              "rounded-xl border p-3",
              n.leida ? "bg-card" : "border-brand/30 bg-brand/5",
            )}
          >
            <p className="font-medium">{n.titulo}</p>
            {n.cuerpo && (
              <p className="text-sm text-muted-foreground">{n.cuerpo}</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {n.creadaEn.toLocaleString("es-VE")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
