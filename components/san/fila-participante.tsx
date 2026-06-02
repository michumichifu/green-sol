import { User, Check } from "lucide-react";

interface FilaParticipanteProps {
  usuario: {
    nombre: string | null;
    apellido: string | null;
    nombreUsuario: string | null;
    fotoUrl: string | null;
  };
  esOrganizador: boolean;
  turnoPosicion?: number | null;
  cobrado?: boolean;
}

export function FilaParticipante({
  usuario,
  esOrganizador,
  turnoPosicion,
  cobrado,
}: FilaParticipanteProps) {
  const nombreCompleto =
    [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || null;

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {/* Izquierda: foto o ícono */}
      <div className="shrink-0">
        {usuario.fotoUrl ? (
          <img
            src={usuario.fotoUrl}
            alt={nombreCompleto ?? usuario.nombreUsuario ?? ""}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <User
            className={`size-6 ${esOrganizador ? "text-gold" : "text-muted-foreground"}`}
          />
        )}
      </div>

      {/* Centro: nombre + @usuario + badge organizador */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 truncate">
          {nombreCompleto && (
            <span className="truncate text-sm font-medium">{nombreCompleto}</span>
          )}
          {usuario.nombreUsuario && (
            <span className="shrink-0 text-xs text-muted-foreground">
              @{usuario.nombreUsuario}
            </span>
          )}
          {esOrganizador && (
            <span className="shrink-0 text-[10px] font-semibold text-gold">
              Organizador
            </span>
          )}
        </div>
      </div>

      {/* Derecha: turno y/o check */}
      <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        {turnoPosicion != null && <span>turno {turnoPosicion}</span>}
        {cobrado && <Check className="size-3.5 text-brand" />}
      </div>
    </div>
  );
}
