import { prisma } from "@/lib/db";
import { enviarCorreo } from "@/lib/mailer";
import { correoBase } from "@/lib/correo/plantillas";

type BaseNoti = {
  tipo: string;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
};

/**
 * Notifica al usuario en la app (campanita) **y** por correo. Para eventos
 * importantes: seguridad (métodos de pago), creación de un ahorro, etc.
 */
export async function notificarYCorreo(
  usuario: { id: string; correo: string },
  base: BaseNoti,
): Promise<void> {
  await crearNotificacion(usuario.id, base);
  const texto = base.cuerpo ? `${base.titulo}\n\n${base.cuerpo}` : base.titulo;
  // Layout de marca general: el título/cuerpo cambian según la acción.
  const html = correoBase({
    titulo: base.titulo,
    cuerpoHtml: base.cuerpo
      ? `<p style="margin:0;">${base.cuerpo}</p>`
      : "",
  });
  try {
    await enviarCorreo(usuario.correo, base.titulo, `${texto}\n\n— Green Sol`, html);
  } catch {
    // si el SMTP falla, la notificación in-app ya quedó registrada
  }
}

/** Crea una notificación para un usuario (campanita). */
export async function crearNotificacion(
  usuarioId: string,
  base: BaseNoti,
): Promise<void> {
  await prisma.notificacion.create({ data: { usuarioId, ...base } });
}

/** Crea la misma notificación para varios usuarios. */
export async function notificarVarios(
  usuarioIds: string[],
  base: BaseNoti,
): Promise<void> {
  if (!usuarioIds.length) return;
  await prisma.notificacion.createMany({
    data: usuarioIds.map((usuarioId) => ({ usuarioId, ...base })),
  });
}

export async function contarNoLeidas(usuarioId: string): Promise<number> {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
}
