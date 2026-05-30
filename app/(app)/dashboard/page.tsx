import { obtenerUsuario } from "@/lib/auth/session";
import { cerrarSesionAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const usuario = await obtenerUsuario();

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Hola</h1>
        <p className="text-muted-foreground">{usuario?.correo}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Tu panel todavía está en construcción. Pronto verás tus sanes, las tasas
        del día y tu reputación.
      </p>
      <form action={cerrarSesionAction}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
