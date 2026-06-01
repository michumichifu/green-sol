import { prisma } from "@/lib/db";
import type {
  VerificacionKyc,
  EstadoKyc,
  TipoDocumento,
  Nacionalidad,
} from "@prisma/client";

/** Última solicitud de verificación del usuario (la más reciente), o null. */
export async function ultimaVerificacion(
  usuarioId: string,
): Promise<VerificacionKyc | null> {
  return prisma.verificacionKyc.findFirst({
    where: { usuarioId },
    orderBy: { creadaEn: "desc" },
  });
}

/** Vista serializable de una solicitud para la cola del super-admin. */
export type SolicitudVista = {
  id: string;
  estado: EstadoKyc;
  creadaEn: string;
  motivoRechazo: string | null;
  notaInterna: string | null;
  tipoDocumento: TipoDocumento | null;
  nacionalidad: Nacionalidad | null;
  numeroDocumento: string | null;
  tieneReverso: boolean;
  tieneVideo: boolean;
  usuario: {
    nombre: string | null;
    apellido: string | null;
    nombreUsuario: string | null;
    correo: string;
  };
};

/**
 * Cola de revisión: la última solicitud por usuario, agrupada por estado.
 * Pendientes = pendiente + en_revision; Rechazadas = rechazada + baneada +
 * reenvio_solicitado (no aprobadas / con observación).
 */
export async function colaVerificaciones(): Promise<{
  pendientes: SolicitudVista[];
  aprobadas: SolicitudVista[];
  rechazadas: SolicitudVista[];
}> {
  const todas = await prisma.verificacionKyc.findMany({
    orderBy: { creadaEn: "desc" },
    include: {
      usuario: {
        select: { nombre: true, apellido: true, nombreUsuario: true, correo: true },
      },
    },
  });
  // Quedarse con la última por usuario.
  const vistos = new Set<string>();
  const ultimas = todas.filter((v) => {
    if (vistos.has(v.usuarioId)) return false;
    vistos.add(v.usuarioId);
    return true;
  });
  const vista = (v: (typeof ultimas)[number]): SolicitudVista => ({
    id: v.id,
    estado: v.estado,
    creadaEn: v.creadaEn.toISOString(),
    motivoRechazo: v.motivoRechazo,
    notaInterna: v.notaInterna,
    tipoDocumento: v.tipoDocumento,
    nacionalidad: v.nacionalidad,
    numeroDocumento: v.numeroDocumento,
    tieneReverso: !!v.docReversoKey,
    tieneVideo: !!v.videoKey,
    usuario: v.usuario,
  });
  return {
    pendientes: ultimas
      .filter((v) => v.estado === "pendiente" || v.estado === "en_revision")
      .map(vista),
    aprobadas: ultimas.filter((v) => v.estado === "aprobada").map(vista),
    rechazadas: ultimas
      .filter(
        (v) =>
          v.estado === "rechazada" ||
          v.estado === "baneada" ||
          v.estado === "reenvio_solicitado",
      )
      .map(vista),
  };
}
