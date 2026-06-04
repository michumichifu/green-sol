import { Check, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilaParticipante } from "@/components/san/fila-participante";
import { etiquetaUsuario } from "@/lib/usuario-etiqueta";

type UsuarioM = {
  nombre: string | null;
  apellido: string | null;
  nombreUsuario: string | null;
  fotoUrl: string | null;
};

type ParticipanteM = {
  id: string;
  usuarioId: string;
  usuario: UsuarioM;
  turno: { posicion: number; cobrado: boolean } | null;
};

type AporteM = {
  participanteId: string;
  estado: string;
  creadoEn: Date;
  fechaPago: Date | null;
};

type SolicitudM = {
  id: string;
  usuario: UsuarioM & { correo: string };
};

/**
 * Pestaña Miembros: solicitudes pendientes (solo organizador, con aprobar/rechazar)
 * y la lista de participantes con su turno, estado de pago y fecha del último pago.
 */
export function Miembros({
  participantes,
  aportes,
  organizadorId,
  esOrganizador,
  solicitudes,
  resolver,
}: {
  participantes: ParticipanteM[];
  aportes: AporteM[];
  organizadorId: string;
  esOrganizador: boolean;
  solicitudes: SolicitudM[];
  resolver: (solicitudId: string, aprobar: boolean) => Promise<void>;
}) {
  // Último aporte por participante (para estado de pago + fecha).
  const ultimoPorParticipante = new Map<string, AporteM>();
  for (const a of aportes) {
    const prev = ultimoPorParticipante.get(a.participanteId);
    if (!prev || a.creadoEn > prev.creadoEn) {
      ultimoPorParticipante.set(a.participanteId, a);
    }
  }

  return (
    <div className="space-y-6">
      {esOrganizador && solicitudes.length > 0 && (
        <section className="space-y-2 rounded-xl border border-gold/40 bg-gold/5 p-4">
          <h2 className="text-sm font-semibold">
            Solicitudes pendientes ({solicitudes.length})
          </h2>
          <ul className="divide-y">
            {solicitudes.map((s) => {
              const aprobar = resolver.bind(null, s.id, true);
              const rechazar = resolver.bind(null, s.id, false);
              return (
                <li key={s.id} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <FilaParticipante usuario={s.usuario} esOrganizador={false} />
                    <p className="truncate text-xs text-muted-foreground">
                      {etiquetaUsuario(s.usuario)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <form action={aprobar}>
                      <Button type="submit" size="sm" className="gap-1">
                        <ThumbsUp className="size-4" /> Aprobar
                      </Button>
                    </form>
                    <form action={rechazar}>
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

      <section className="space-y-1 rounded-xl border p-4">
        <h2 className="mb-1 text-sm font-semibold">
          Participantes ({participantes.length})
        </h2>
        <ul className="divide-y">
          {participantes.map((p) => {
            const ultimo = ultimoPorParticipante.get(p.id);
            const pago =
              ultimo?.estado === "confirmado"
                ? { txt: "Pagó", cls: "text-brand", icon: <Check className="size-3.5" /> }
                : ultimo?.estado === "reportado"
                  ? { txt: "Reportó", cls: "text-amber-600 dark:text-amber-400", icon: <Clock className="size-3.5" /> }
                  : { txt: "Pendiente", cls: "text-muted-foreground", icon: null };
            return (
              <li key={p.id} className="py-1">
                <FilaParticipante
                  usuario={p.usuario}
                  esOrganizador={p.usuarioId === organizadorId}
                  turnoPosicion={p.turno?.posicion}
                  cobrado={p.turno?.cobrado}
                />
                <div className="flex items-center gap-1.5 pl-[34px] text-xs">
                  <span className={`inline-flex items-center gap-1 ${pago.cls}`}>
                    {pago.icon}
                    {pago.txt}
                  </span>
                  {ultimo && (
                    <span className="text-muted-foreground">
                      · {(ultimo.fechaPago ?? ultimo.creadoEn).toLocaleDateString("es-VE")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
