import { DonaProgreso } from "./dona-progreso";
import { CompartirAhorro } from "@/components/compartir-ahorro";
import { Invitar, type InvitacionVista } from "./invitar";
import { MONEDA_RECOLECTA } from "@/lib/validations/recolecta";

// Tipos inline derivados de lo que devuelve la query de prisma en el page
type DatosPago = {
  tipo: string;
  wallet?: string | null;
  banco?: string | null;
  tipoCuenta?: string | null;
  numeroCuenta?: string | null;
  telefono?: string | null;
  titular?: string | null;
  cedula?: string | null;
} | null;

type Turno = {
  posicion: number;
  cobrado: boolean;
} | null;

type Participante = {
  id: string;
  usuarioId: string;
  usuario: {
    nombre: string | null;
    apellido: string | null;
    nombreUsuario: string | null;
    fotoUrl: string | null;
  };
  turno: Turno;
};

type Recolecta = {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  moneda: string;
  montoAporte: number | null;
  meta: number | null;
  frecuencia: string | null;
  cupoMiembros: number | null;
  descripcion: string | null;
  visibilidad: string;
  organizadorId: string;
  datosPago: DatosPago;
  participantes: Participante[];
};

interface ResumenSanProps {
  recolecta: Recolecta;
  esOrganizador: boolean;
  esParticipante: boolean;
  invitaciones?: InvitacionVista[];
  generar?: (dias: number) => Promise<{ codigo?: string; enlace?: string; error?: string }>;
  revocar?: (id: string) => Promise<void>;
}

const COLORES_ESTADO: Record<string, string> = {
  abierta: "text-brand",
  activa: "text-blue-500",
  cerrada: "text-muted-foreground",
};

const LABEL_ESTADO: Record<string, string> = {
  abierta: "Abierta",
  activa: "Activa",
  cerrada: "Cerrada",
};

export function ResumenSan({
  recolecta: r,
  esOrganizador,
  esParticipante,
  invitaciones,
  generar,
  revocar,
}: ResumenSanProps) {
  const info = MONEDA_RECOLECTA[r.moneda];
  const ancla = info?.ancla ?? "$";

  // Criterio para la dona:
  // - total = cupoMiembros si existe, si no = nº de participantes actuales
  // - pagados = nº de turnos con cobrado=true (para san) o 0 (para vaca/abierta sin turnos)
  // Esto refleja cuántas personas ya recibieron su turno en el san.
  const total = r.cupoMiembros ?? r.participantes.length;
  const pagados = r.participantes.filter((p) => p.turno?.cobrado === true).length;

  // Ronda actual: la siguiente posición no cobrada
  const turnosCobrados = pagados;
  const rondaActual = turnosCobrados + 1;
  const totalRondas = r.cupoMiembros ?? r.participantes.length;

  const colorEstado = COLORES_ESTADO[r.estado] ?? "text-muted-foreground";
  const labelEstado = LABEL_ESTADO[r.estado] ?? r.estado;
  const chipRol = esOrganizador ? "Organizador" : "Participante";
  const visibilidadLabel = r.visibilidad === "publico" ? "Público" : "Privado";
  const organizadorU = r.participantes.find(
    (p) => p.usuarioId === r.organizadorId,
  )?.usuario;
  const nombreOrganizador = organizadorU
    ? [organizadorU.nombre, organizadorU.apellido].filter(Boolean).join(" ") ||
      organizadorU.nombreUsuario ||
      "Organizador"
    : null;

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-xl font-bold leading-tight">{r.nombre}</h1>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`text-xs font-semibold uppercase ${colorEstado}`}>
              {labelEstado}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {chipRol}
            </span>
          </div>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {r.tipo === "san"
            ? `${r.cupoMiembros ?? "?"} personas${r.frecuencia ? ` · ${r.frecuencia}` : ""} · ${visibilidadLabel}`
            : `Meta común · ${visibilidadLabel}`}
        </p>
        {nombreOrganizador && (
          <p className="text-xs text-muted-foreground">
            Organiza: <span className="font-medium text-foreground">{nombreOrganizador}</span>
            {organizadorU?.nombreUsuario ? ` · @${organizadorU.nombreUsuario}` : ""}
          </p>
        )}
        {r.descripcion && <p className="mt-1.5 text-sm">{r.descripcion}</p>}
      </div>

      {/* Montos: aporte de cada persona vs lo que recibe quien cobra el turno */}
      {r.tipo === "san" && (
        <div className="space-y-1 rounded-xl border p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Aporta cada persona</span>
            <span className="text-base font-bold">
              {ancla} {r.montoAporte ?? "?"}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Recibe quien cobra</span>
            <span className="text-sm font-semibold">
              {ancla} {r.meta ?? "?"}
            </span>
          </div>
          {info?.enBolivares && (
            <p className="pt-1 text-xs text-muted-foreground">
              Se paga en Bs a la tasa del día (ver pestaña Pagos).
            </p>
          )}
        </div>
      )}

      {/* Progreso + dona */}
      {r.tipo === "san" && (
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <DonaProgreso pagados={pagados} total={total} label="cobrados" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              Ronda {rondaActual} de {totalRondas}
            </p>
            <p className="text-xs text-muted-foreground">
              Ya cobró {pagados} de {total} {total === 1 ? "turno" : "turnos"}
            </p>
          </div>
        </div>
      )}

      {/* Invitar — visible mientras el san no esté cerrado (gestión del organizador) */}
      {r.estado !== "cerrada" &&
        (esOrganizador && invitaciones && generar && revocar ? (
          <Invitar
            invitaciones={invitaciones}
            generar={generar}
            revocar={revocar}
          />
        ) : esParticipante ? (
          <CompartirAhorro codigo={r.id} nombre={r.nombre} />
        ) : null)}
    </div>
  );
}
