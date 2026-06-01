import { correoBase } from "@/lib/correo/plantillas";

/**
 * Catálogo de notificaciones. Cada evento declara qué CANALES soporta:
 * - app: notificación in-app (título + cuerpo, texto explícito, admite emojis).
 * - correo: asunto + HTML (plantilla con la marca).
 * No todos usan ambos (p. ej. el OTP nunca va in-app por seguridad).
 * El super-admin edita cualquiera; el override se guarda en ConfiguracionApp y,
 * si no existe, se usa el default de este catálogo.
 */
export type CanalPlantilla = "app" | "correo";

export type CategoriaPlantilla =
  | "Pruebas"
  | "Verificación"
  | "Cuenta"
  | "Pagos"
  | "Ahorros";

export type EventoNotificacion = {
  clave: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaPlantilla;
  /** Canales que aplican a este evento (no todos usan app y correo). */
  canales: CanalPlantilla[];
  variables: Record<string, string>;
  datosMuestra: Record<string, string>;
  app: { titulo: string; cuerpo: string };
  correo: { asunto: string; html: string };
};

const LINK_DEMO = "https://greensol.creceideas.com/sanes/unirse?codigo=GS-AB12";

export const EVENTOS_NOTIFICACION: EventoNotificacion[] = [
  {
    clave: "prueba_smtp",
    nombre: "Prueba de SMTP",
    descripcion: "Correo de prueba desde la configuración SMTP. Solo correo.",
    categoria: "Pruebas",
    canales: ["correo"],
    variables: {},
    datosMuestra: {},
    app: { titulo: "Prueba", cuerpo: "Notificación de prueba." },
    correo: {
      asunto: "Prueba SMTP — Green Sol",
      html: correoBase({
        titulo: "¡Tu SMTP funciona! ✅",
        preheader: "Correo de prueba de Green Sol",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Este es un <strong>correo de prueba</strong> enviado desde el panel de Green Sol.</p>" +
          "<p style='margin:0;'>Si lo ves con este diseño, tu SMTP está configurado correctamente y los correos llegarán así de bien.</p>",
      }),
    },
  },
  {
    clave: "correo_otp",
    nombre: "Código de verificación (OTP)",
    descripcion:
      "Código de un solo uso. Por correo (WhatsApp a futuro). No se muestra in-app por seguridad.",
    categoria: "Verificación",
    canales: ["correo"],
    variables: { codigo: "Código de 6 dígitos" },
    datosMuestra: { codigo: "428913" },
    app: { titulo: "Código de verificación", cuerpo: "(No se envía in-app)." },
    correo: {
      asunto: "Tu código de verificación: {{codigo}}",
      html: correoBase({
        titulo: "Verifica tu cuenta",
        preheader: "Tu código de verificación de Green Sol",
        cuerpoHtml:
          "<p style='margin:0 0 16px;'>Usa este código para continuar. Vence en unos minutos.</p>" +
          "<div style='text-align:center;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#0E9F6E;background:#EAF7F1;border-radius:12px;padding:18px;'>{{codigo}}</div>" +
          "<p style='margin:16px 0 0;font-size:13px;color:#8A958F;'>Si no fuiste tú, ignora este correo.</p>",
      }),
    },
  },
  {
    clave: "correo_verificado",
    nombre: "Cuenta verificada",
    descripcion: "Bienvenida al verificar el correo.",
    categoria: "Cuenta",
    canales: ["app", "correo"],
    variables: { usuario: "Nombre del usuario", link: "URL de la app" },
    datosMuestra: { usuario: "María", link: "https://greensol.creceideas.com" },
    app: {
      titulo: "✅ ¡Cuenta verificada!",
      cuerpo:
        "¡Bienvenido, {{usuario}}! 🎉 Tu cuenta ya está activa. Crea tu primer ahorro o únete a uno con tu grupo.",
    },
    correo: {
      asunto: "¡Cuenta verificada! Bienvenido a Green Sol",
      html: correoBase({
        titulo: "¡Bienvenido, {{usuario}}! 🎉",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Tu correo quedó <strong>verificado</strong> y tu cuenta está lista.</p>" +
          "<p style='margin:0;'>Ya puedes crear tu primer ahorro o unirte a uno con tu grupo.</p>",
        ctaTexto: "Ir a Green Sol",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "metodo_pago_agregado",
    nombre: "Método de pago agregado",
    descripcion: "Aviso al agregar un método de pago.",
    categoria: "Pagos",
    canales: ["app", "correo"],
    variables: { usuario: "Nombre del usuario", metodo: "Método agregado" },
    datosMuestra: { usuario: "María", metodo: "Pago móvil · Bs" },
    app: {
      titulo: "💳 Método de pago agregado",
      cuerpo:
        "Agregaste «{{metodo}}» a tus métodos de pago. Si no fuiste tú, revisa tu cuenta.",
    },
    correo: {
      asunto: "Agregaste un método de pago",
      html: correoBase({
        titulo: "Método de pago agregado",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{usuario}}, agregaste un método de pago: <strong>{{metodo}}</strong>.</p>" +
          "<p style='margin:0;font-size:13px;color:#8A958F;'>Si no fuiste tú, revisa tu cuenta y cambia tu contraseña.</p>",
      }),
    },
  },
  {
    clave: "metodo_pago_editado",
    nombre: "Método de pago editado",
    descripcion: "Aviso al editar un método de pago.",
    categoria: "Pagos",
    canales: ["app", "correo"],
    variables: { usuario: "Nombre del usuario", metodo: "Método editado" },
    datosMuestra: { usuario: "María", metodo: "Pago móvil · Bs" },
    app: {
      titulo: "✏️ Método de pago actualizado",
      cuerpo:
        "Actualizaste «{{metodo}}». Si no fuiste tú, revisa tu cuenta enseguida.",
    },
    correo: {
      asunto: "Editaste un método de pago",
      html: correoBase({
        titulo: "Método de pago actualizado",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{usuario}}, editaste tu método de pago: <strong>{{metodo}}</strong>.</p>" +
          "<p style='margin:0;font-size:13px;color:#8A958F;'>Si no fuiste tú, revisa tu cuenta enseguida.</p>",
      }),
    },
  },
  {
    clave: "metodo_pago_eliminado",
    nombre: "Método de pago eliminado",
    descripcion: "Aviso al eliminar un método de pago.",
    categoria: "Pagos",
    canales: ["app", "correo"],
    variables: { usuario: "Nombre del usuario", metodo: "Método eliminado" },
    datosMuestra: { usuario: "María", metodo: "Pago móvil · Bs" },
    app: {
      titulo: "🗑️ Método de pago eliminado",
      cuerpo:
        "Eliminaste «{{metodo}}». Si no fuiste tú, revisa tu cuenta enseguida.",
    },
    correo: {
      asunto: "Eliminaste un método de pago",
      html: correoBase({
        titulo: "Método de pago eliminado",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{usuario}}, eliminaste el método de pago: <strong>{{metodo}}</strong>.</p>" +
          "<p style='margin:0;font-size:13px;color:#8A958F;'>Si no fuiste tú, revisa tu cuenta enseguida.</p>",
      }),
    },
  },
  {
    clave: "san_creado",
    nombre: "San creado",
    descripcion: "Felicitación al organizador al crear un san, con código y link.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      usuario: "Nombre del organizador",
      nombreSan: "Nombre del san",
      codigoInvitacion: "Código de invitación",
      link: "Enlace para unirse",
    },
    datosMuestra: {
      usuario: "María",
      nombreSan: "San de los amigos",
      codigoInvitacion: "GS-AB12",
      link: LINK_DEMO,
    },
    app: {
      titulo: "🎉 ¡Creaste tu san!",
      cuerpo:
        "Tu san «{{nombreSan}}» está listo. Comparte el código {{codigoInvitacion}} para que tu grupo se una.",
    },
    correo: {
      asunto: "¡Creaste tu san «{{nombreSan}}»! 🎉",
      html: correoBase({
        titulo: "¡Creaste tu san! 🎉",
        preheader: "Comparte tu san y empieza a ahorrar en grupo",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>¡Felicidades, {{usuario}}! Creaste el san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0 0 16px;'>Comparte este código para que tu grupo se una:</p>" +
          "<div style='text-align:center;font-size:24px;font-weight:800;letter-spacing:0.12em;color:#0E9F6E;background:#EAF7F1;border-radius:12px;padding:14px;'>{{codigoInvitacion}}</div>",
        ctaTexto: "Compartir invitación",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "union_san",
    nombre: "Alguien se unió a tu san",
    descripcion: "Aviso al organizador cuando alguien se une a su san.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      organizador: "Nombre del organizador",
      usuario: "Quien se unió",
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      organizador: "María",
      usuario: "Pedro",
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "👋 Nuevo integrante en tu san",
      cuerpo:
        "{{usuario}} se unió a «{{nombreSan}}». ¡Cuando esté completo podrás sortear los turnos!",
    },
    correo: {
      asunto: "{{usuario}} se unió a tu san",
      html: correoBase({
        titulo: "¡Tu san suma un integrante! 👋",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{organizador}}, <strong>{{usuario}}</strong> se unió a tu san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>Cuando esté completo, podrás sortear los turnos y arrancar.</p>",
        ctaTexto: "Ver el san",
        ctaUrl: "{{link}}",
      }),
    },
  },
];

export function eventoPorClave(clave: string): EventoNotificacion | undefined {
  return EVENTOS_NOTIFICACION.find((e) => e.clave === clave);
}

/** Claves de ConfiguracionApp donde se guarda el override de un canal. */
export function clavesPlantilla(clave: string, canal: CanalPlantilla) {
  const base = `PLANTILLA_${clave.toUpperCase()}_${canal.toUpperCase()}`;
  return { asunto: `${base}_ASUNTO`, contenido: `${base}_CONTENIDO` };
}

/** Reemplaza {{variable}} por su valor. Vacío si la variable no existe. */
export function aplicarVariables(
  plantilla: string,
  datos: Record<string, string>,
): string {
  return plantilla.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) =>
    datos[k] == null ? "" : String(datos[k]),
  );
}
