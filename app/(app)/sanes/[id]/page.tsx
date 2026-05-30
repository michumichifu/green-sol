import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  invitarPorCorreo,
  generarTurnos,
  reportarPago,
  resolverAporte,
  cerrarRecolecta,
  valorar,
} from "../actions";
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
      aportes: {
        include: { participante: { include: { usuario: true } } },
        orderBy: { creadoEn: "desc" },
      },
    },
  });
  if (!r) notFound();

  const esParticipante = r.participantes.some((p) => p.usuarioId === usuario.id);
  if (!esParticipante && r.visibilidad === "privado") notFound();
  const esOrganizador = r.organizadorId === usuario.id;
  const invitar = invitarPorCorreo.bind(null, r.id);
  const generar = generarTurnos.bind(null, r.id);
  const reportar = reportarPago.bind(null, r.id);
  const cerrar = cerrarRecolecta.bind(null, r.id);

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

      {esParticipante && (
        <form action={reportar} className="space-y-2 rounded-xl border p-4">
          <h2 className="font-semibold">Reportar un pago</h2>
          <div className="flex gap-2">
            <Input
              name="monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto USD"
              required
            />
            <Input name="referencia" placeholder="Referencia" />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Reportar pago
          </Button>
        </form>
      )}

      {r.aportes.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Pagos reportados</h2>
          <ul className="space-y-1 text-sm">
            {r.aportes.map((a) => {
              const confirmar = resolverAporte.bind(null, a.id, true);
              const rechazar = resolverAporte.bind(null, a.id, false);
              return (
                <li
                  key={a.id}
                  className="rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span>{a.participante.usuario.correo}</span>
                    <span>
                      ${a.monto} · {a.estado}
                    </span>
                  </div>
                  {a.referencia && (
                    <p className="text-xs text-muted-foreground">
                      Ref: {a.referencia}
                    </p>
                  )}
                  {esOrganizador && a.estado === "reportado" && (
                    <div className="mt-1 flex gap-2">
                      <form action={confirmar}>
                        <Button type="submit" size="sm" variant="outline">
                          Confirmar
                        </Button>
                      </form>
                      <form action={rechazar}>
                        <Button type="submit" size="sm" variant="ghost">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {r.estado === "cerrada" && esParticipante && (
        <section className="space-y-2 rounded-xl border p-4">
          <h2 className="font-semibold">Valorar participantes</h2>
          <p className="text-xs text-muted-foreground">
            Califica tu experiencia con cada uno.
          </p>
          <ul className="space-y-1 text-sm">
            {r.participantes
              .filter((p) => p.usuarioId !== usuario.id)
              .map((p) => {
                const arriba = valorar.bind(null, r.id, p.usuarioId, 1);
                const abajo = valorar.bind(null, r.id, p.usuarioId, -1);
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                  >
                    <span>{p.usuario.correo}</span>
                    <div className="flex gap-2">
                      <form action={arriba}>
                        <Button type="submit" size="sm" variant="outline">
                          <ThumbsUp className="size-4" />
                        </Button>
                      </form>
                      <form action={abajo}>
                        <Button type="submit" size="sm" variant="ghost">
                          <ThumbsDown className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
          </ul>
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
          {r.estado !== "cerrada" && (
            <form action={cerrar}>
              <Button type="submit" variant="ghost" className="w-full">
                Cerrar recolecta
              </Button>
            </form>
          )}
        </section>
      )}
    </main>
  );
}
