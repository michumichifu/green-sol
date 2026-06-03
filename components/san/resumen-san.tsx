import { DonaProgreso } from "./dona-progreso";
import { CompartirAhorro } from "@/components/compartir-ahorro";
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
            ? `Aporte por turno: ${ancla} ${r.montoAporte ?? "?"}`
            : `Meta: ${ancla} ${r.meta ?? "?"}`}{" "}
          · {r.visibilidad}
        </p>
        {r.tipo === "san" && (r.cupoMiembros || r.frecuencia) && (
          <p className="text-xs text-muted-foreground">
            {r.cupoMiembros ? `${r.cupoMiembros} personas` : ""}
            {r.cupoMiembros && r.frecuencia ? " · " : ""}
            {r.frecuencia ?? ""}
            {info?.enBolivares ? " · se paga en Bs a la tasa del día" : ""}
          </p>
        )}
        {r.descripcion && <p className="mt-1.5 text-sm">{r.descripcion}</p>}
      </div>

      {/* Progreso + dona */}
      {r.tipo === "san" && (
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <DonaProgreso pagados={pagados} total={total} label="esta ronda" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              Ronda {rondaActual} de {totalRondas}
            </p>
            <p className="text-xs text-muted-foreground">
              {pagados} {pagados === 1 ? "turno cobrado" : "turnos cobrados"}
            </p>
            {r.montoAporte && (
              <p className="text-xs text-muted-foreground">
                Aporte: {ancla} {r.montoAporte}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invitar — solo si está abierta y es participante */}
      {esParticipante && r.estado === "abierta" && (
        <CompartirAhorro codigo={r.id} nombre={r.nombre} />
      )}
    </div>
  );
}
