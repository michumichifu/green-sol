import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { obtenerUsuario } from "@/lib/auth/session";
import { obtenerTasas } from "@/lib/rates/cache";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import {
  invitarPorCorreo,
  iniciarSan,
  generarInvitacion,
  revocarInvitacion,
  listarInvitacionesActivas,
  reportarPago,
  resolverAporte,
  resolverSolicitud,
  valorar,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelTabs } from "@/components/panel-tabs";
import { ResumenSan } from "@/components/san/resumen-san";
import { Miembros } from "@/components/san/miembros";
import { CerrarSan } from "@/components/san/cerrar-san";
import { MetodoPagoTarjeta } from "@/components/san/metodo-pago-tarjeta";
import { PagosParticipante } from "@/components/san/pagos-participante";
import { PagosOrganizador } from "@/components/san/pagos-organizador";

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
      datosPago: true,
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
  const iniciar = iniciarSan.bind(null, r.id);
  const reportar = reportarPago.bind(null, r.id);

  // Estado de inicio del san y aportantes (con turno).
  const sanIniciado = r.turnos.length > 0;
  const aportantes = r.participantes
    .filter((p) => r.organizadorParticipa || p.usuarioId !== r.organizadorId)
    .map((p) => ({
      id: p.id,
      nombre: p.usuario.nombre,
      apellido: p.usuario.apellido,
      nombreUsuario: p.usuario.nombreUsuario,
      esOrganizador: p.usuarioId === r.organizadorId,
    }));

  const tasas = await obtenerTasas();
  const participanteActual = r.participantes.find((p) => p.usuarioId === usuario.id);
  const misAportes = participanteActual
    ? r.aportes.filter((a) => a.participante.usuarioId === usuario.id)
    : [];

  // Solicitudes de unión pendientes (solo relevantes para el organizador).
  const solicitudes = esOrganizador
    ? await prisma.solicitudUnion.findMany({
        where: { recolectaId: r.id, estado: "pendiente" },
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true,
              nombreUsuario: true,
              fotoUrl: true,
              correo: true,
            },
          },
        },
        orderBy: { creadaEn: "asc" },
      })
    : [];
  const hayPendientes = solicitudes.length > 0;

  // Invitaciones temporales activas (las gestiona el organizador desde el Resumen).
  const invitaciones = esOrganizador
    ? (await listarInvitacionesActivas(r.id)).map((inv) => ({
        id: inv.id,
        codigo: inv.codigo,
        expiraEn: inv.expiraEn.toISOString(),
      }))
    : [];
  const generarInv = generarInvitacion.bind(null, r.id);

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <PanelTabs
        tabs={["Resumen", "Miembros", "Pagos"]}
        avisos={[false, hayPendientes, false]}
      >
        {/* Pestaña 0 — Resumen */}
        <ResumenSan
          recolecta={r}
          esOrganizador={esOrganizador}
          esParticipante={esParticipante}
          invitaciones={invitaciones}
          generar={generarInv}
          revocar={revocarInvitacion}
          sanIniciado={sanIniciado}
          aportantes={aportantes}
          iniciar={iniciar}
        />

        {/* Pestaña 1 — Miembros */}
        <div className="space-y-6">
          <Miembros
            participantes={r.participantes}
            aportes={r.aportes}
            organizadorId={r.organizadorId}
            esOrganizador={esOrganizador}
            solicitudes={solicitudes}
            resolver={resolverSolicitud}
            fechaInicio={r.fechaInicio}
            diasFrecuencia={
              r.frecuenciaDias ??
              (r.frecuencia === "mensual" ? 30 : r.frecuencia === "quincenal" ? 15 : 7)
            }
          />

          {/* Administrar — gestión del organizador (invitar por correo, turnos, cerrar) */}
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
              {r.estado !== "cerrada" && <CerrarSan recolectaId={r.id} />}
            </section>
          )}
        </div>

        {/* Pestaña 2 — Pagos */}
        <div className="space-y-6">
          {/* Método de pago del san, arriba para ambos roles */}
          <MetodoPagoTarjeta datosPago={r.datosPago} moneda={r.moneda} />

          {/* Vista del participante (Task 6) */}
          {esParticipante && !esOrganizador && (
            <PagosParticipante
              recolecta={r}
              tasas={tasas}
              misAportes={misAportes}
              reportar={reportar}
            />
          )}

          {/* Vista del organizador: revisión de pagos (Task 7) */}
          {esOrganizador && (
            <PagosOrganizador
              recolecta={r}
              tasas={tasas}
              aportes={r.aportes}
              resolver={resolverAporte}
            />
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
        </div>
      </PanelTabs>
    </main>
  );
}
