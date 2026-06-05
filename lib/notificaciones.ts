import { prisma } from "@/lib/db";
import { enviarCorreo } from "@/lib/mailer";
import { correoBase } from "@/lib/correo/plantillas";
import { eventoPorClave } from "@/lib/correo/catalogo";
import { resolverNotificacion } from "@/lib/correo/resolver";

type BaseNoti = {
  tipo: string;
  titulo: string;
  cuerpo?: string;
  enlace?: string;
};

/**
 * Dispara un evento del catálogo de plantillas (app y/o correo según sus
 * canales), usando los textos editados en el editor visual (override en BD) o
 * el default del catálogo. Reemplaza las variables con `datos`.
 */
export async function notificarEvento(
  usuario: { id: string; correo: string | null },
  clave: string,
  datos: Record<string, string> = {},
  opts?: { tipo?: string; enlace?: string },
): Promise<void> {
  const evento = eventoPorClave(clave);
  if (!evento) return;

  if (evento.canales.includes("app")) {
    const app = await resolverNotificacion(clave, "app", datos);
    if (app) {
      await crearNotificacion(usuario.id, {
        tipo: opts?.tipo ?? "info",
        titulo: app.asunto,
        cuerpo: app.contenido,
        enlace: opts?.enlace,
      });
    }
  }
  if (evento.canales.includes("correo")) {
    const correo = await resolverNotificacion(clave, "correo", datos);
    // Usuario registrado con wallet y sin correo vinculado: solo notificación in-app.
    if (correo && usuario.correo) {
      try {
        await enviarCorreo(usuario.correo, correo.asunto, correo.texto, correo.contenido);
      } catch {
        // si el SMTP falla, la notificación in-app ya quedó registrada
      }
    }
  }
}

/**
 * Notifica al usuario en la app (campanita) **y** por correo. Para eventos
 * importantes: seguridad (métodos de pago), creación de un ahorro, etc.
 */
export async function notificarYCorreo(
  usuario: { id: string; correo: string | null },
  base: BaseNoti,
): Promise<void> {
  await crearNotificacion(usuario.id, base);
  // Usuario registrado con wallet y sin correo vinculado: solo notificación in-app.
  if (!usuario.correo) return;
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
