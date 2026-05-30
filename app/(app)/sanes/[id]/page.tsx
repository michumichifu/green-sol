import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { invitarPorCorreo, generarTurnos } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function DetalleRecolecta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");

  const r = await prisma.recolecta.findUnique({
    where: { id },
    include: {
      participantes: { include: { usuario: true, turno: true } },
      turnos: {
        include: { participante: { include: { usuario: true } } },
        orderBy: { posicion: "asc" },
      },
    },
  });
  if (!r) notFound();

  const esParticipante = r.participantes.some((p) => p.usuarioId === usuario.id);
  if (!esParticipante && r.visibilidad === "privado") notFound();
  const esOrganizador = r.organizadorId === usuario.id;
  const invitar = invitarPorCorreo.bind(null, r.id);
  const generar = generarTurnos.bind(null, r.id);

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-8">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{r.nombre}</h1>
          <span className="text-xs uppercase text-brand">{r.tipo}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {r.tipo === "san" ? `Aporte: $${r.montoAporte}` : `Meta: $${r.meta}`} ·{" "}
          {r.estado} · {r.visibilidad}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">
          Participantes ({r.participantes.length})
        </h2>
        <ul className="space-y-1 text-sm">
          {r.participantes.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
            >
              <span>
                {p.usuario.correo}
                {p.usuarioId === r.organizadorId && " · organizador"}
              </span>
              {p.turno && (
                <span className="text-xs text-muted-foreground">
                  turno {p.turno.posicion}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {r.tipo === "san" && r.turnos.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Orden de turnos</h2>
          <ol className="space-y-1 text-sm">
            {r.turnos.map((t) => (
              <li key={t.id} className="rounded-lg border bg-card px-3 py-2">
                {t.posicion}. {t.participante.usuario.correo}
                {t.cobrado && " · cobrado"}
              </li>
            ))}
          </ol>
        </section>
      )}

      {esOrganizador && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Administrar</h2>
          <form action={invitar} className="flex gap-2">
            <Input
              name="correo"
              type="email"
              placeholder="correo a invitar"
              required
            />
            <Button type="submit" variant="outline">
              Invitar
            </Button>
          </form>
          {r.tipo === "san" && r.turnos.length === 0 && (
            <form action={generar}>
              <Button type="submit" className="w-full">
                Sortear turnos e iniciar
              </Button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
