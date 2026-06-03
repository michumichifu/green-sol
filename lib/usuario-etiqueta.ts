/** Datos mínimos para etiquetar a un usuario en una notificación. */
export type UsuarioEtiqueta = {
  correo: string;
  nombre?: string | null;
  apellido?: string | null;
  nombreUsuario?: string | null;
};

/** Etiqueta para NOTIFICACIONES: "@usuario (Nombre Apellido)" (usuario primero).
 * Cae a "Nombre Apellido" si no hay @usuario; a @usuario si no hay nombre; al correo si no hay nada.
 * (En la fila de participante el orden es el inverso —nombre primero— y se arma aparte.) */
export function etiquetaUsuario(u: UsuarioEtiqueta): string {
  const nombre = `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim();
  if (u.nombreUsuario) {
    return nombre ? `@${u.nombreUsuario} (${nombre})` : `@${u.nombreUsuario}`;
  }
  return nombre || u.correo;
}
