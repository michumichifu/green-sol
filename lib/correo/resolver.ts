import { obtenerPlantillasGuardadas } from "@/lib/config";
import {
  aplicarVariables,
  clavesPlantilla,
  eventoPorClave,
  type CanalPlantilla,
} from "@/lib/correo/catalogo";

function aTexto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resuelve una notificación de un canal: usa el override guardado si existe, o
 * el default del catálogo, y reemplaza las variables con `datos`.
 * - asunto: asunto (correo) o título (app).
 * - contenido: HTML (correo) o cuerpo (app).
 * - texto: versión en texto plano del contenido (para el `text` del correo).
 */
export async function resolverNotificacion(
  clave: string,
  canal: CanalPlantilla,
  datos: Record<string, string>,
): Promise<{ asunto: string; contenido: string; texto: string } | null> {
  const evento = eventoPorClave(clave);
  if (!evento) return null;
  const guardadas = await obtenerPlantillasGuardadas();
  const k = clavesPlantilla(clave, canal);
  const def =
    canal === "correo"
      ? { asunto: evento.correo.asunto, contenido: evento.correo.html }
      : { asunto: evento.app.titulo, contenido: evento.app.cuerpo };
  const asunto = aplicarVariables(guardadas[k.asunto] || def.asunto, datos);
  const contenido = aplicarVariables(
    guardadas[k.contenido] || def.contenido,
    datos,
  );
  return {
    asunto,
    contenido,
    texto: canal === "correo" ? aTexto(contenido) : contenido,
  };
}
