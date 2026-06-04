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
      asunto: "Verifica tu correo: {{codigo}}",
      html: correoBase({
        titulo: "Verifica tu correo",
        preheader: "Tu código para verificar tu correo en Green Sol",
        cuerpoHtml:
          "<p style='margin:0 0 16px;'>Verifica tu correo con este código. Vence en unos minutos.</p>" +
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
  {
    clave: "san_pago_reportado",
    nombre: "Pago reportado (organizador)",
    descripcion: "Al participante reportar un pago; avisa al organizador para que lo revise.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      organizador: "Nombre del organizador",
      usuario: "Quién pagó",
      monto: "Monto reportado",
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      organizador: "María",
      usuario: "Pedro",
      monto: "$50",
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "💰 Nuevo pago por revisar",
      cuerpo:
        "{{usuario}} reportó un pago de {{monto}} en «{{nombreSan}}». Revísalo cuando puedas.",
    },
    correo: {
      asunto: "Nuevo pago por revisar en «{{nombreSan}}»",
      html: correoBase({
        titulo: "Tienes un pago por revisar 💰",
        preheader: "Un participante reportó un pago en tu san",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{organizador}}, <strong>{{usuario}}</strong> reportó un pago de <strong>{{monto}}</strong> en el san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>Entra para aprobarlo o rechazarlo.</p>",
        ctaTexto: "Revisar pago",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_pago_aprobado",
    nombre: "Pago aprobado (participante)",
    descripcion: "Al organizador aprobar un aporte; avisa al participante.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      usuario: "Nombre del participante",
      monto: "Monto aprobado",
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      usuario: "Pedro",
      monto: "$50",
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "✅ ¡Tu pago fue aprobado!",
      cuerpo: "Tu pago de {{monto}} en «{{nombreSan}}» fue confirmado por el organizador.",
    },
    correo: {
      asunto: "Tu pago en «{{nombreSan}}» fue aprobado ✅",
      html: correoBase({
        titulo: "¡Pago aprobado! ✅",
        preheader: "El organizador confirmó tu pago",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{usuario}}, el organizador <strong>aprobó</strong> tu pago de <strong>{{monto}}</strong> en el san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>¡Sigue así!</p>",
        ctaTexto: "Ver el san",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_pago_rechazado",
    nombre: "Pago rechazado (participante)",
    descripcion: "Al organizador rechazar un aporte; avisa al participante.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      usuario: "Nombre del participante",
      monto: "Monto rechazado",
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      usuario: "Pedro",
      monto: "$50",
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "❌ Tu pago fue rechazado",
      cuerpo:
        "El organizador rechazó tu pago de {{monto}} en «{{nombreSan}}». Contáctalo para resolverlo.",
    },
    correo: {
      asunto: "Tu pago en «{{nombreSan}}» fue rechazado",
      html: correoBase({
        titulo: "Tu pago fue rechazado ❌",
        preheader: "El organizador rechazó tu pago",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Hola {{usuario}}, el organizador <strong>rechazó</strong> tu pago de <strong>{{monto}}</strong> en el san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>Comunícate con el organizador para resolverlo.</p>",
        ctaTexto: "Ver el san",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_solicitud_union",
    nombre: "Solicitud de unión (organizador)",
    descripcion: "Cuando alguien pide unirse a un san privado con el enlace; avisa al organizador para que apruebe o rechace.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      solicitante: "Quién solicita (@usuario (Nombre Apellido))",
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      solicitante: "@pedrop (Pedro Pérez)",
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "👋 Nueva solicitud de unión",
      cuerpo: "{{solicitante}} solicitó unirse a «{{nombreSan}}». Revísalo en la pestaña Miembros.",
    },
    correo: {
      asunto: "Nueva solicitud para unirse a «{{nombreSan}}»",
      html: correoBase({
        titulo: "Alguien quiere unirse 👋",
        preheader: "Tienes una solicitud por revisar",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'><strong>{{solicitante}}</strong> solicitó unirse a tu san <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>Entra a la pestaña Miembros para aprobarla o rechazarla.</p>",
        ctaTexto: "Revisar solicitud",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_solicitud_aceptada",
    nombre: "Solicitud aceptada (participante)",
    descripcion: "Al organizador aprobar una solicitud de unión; avisa al solicitante.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "🎉 ¡Te aceptaron!",
      cuerpo: "Ya eres parte de «{{nombreSan}}». Entra para ver los detalles.",
    },
    correo: {
      asunto: "Te aceptaron en «{{nombreSan}}» 🎉",
      html: correoBase({
        titulo: "¡Bienvenido al san! 🎉",
        preheader: "El organizador aprobó tu solicitud",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>El organizador <strong>aprobó</strong> tu solicitud para unirte a <strong>«{{nombreSan}}»</strong>.</p>" +
          "<p style='margin:0;'>Ya eres parte del san. Entra para ver los detalles.</p>",
        ctaTexto: "Ver el san",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_solicitud_rechazada",
    nombre: "Solicitud rechazada (participante)",
    descripcion: "Al organizador rechazar una solicitud de unión; avisa al solicitante.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      nombreSan: "Nombre del san",
      link: "Enlace al san",
    },
    datosMuestra: {
      nombreSan: "San de los amigos",
      link: LINK_DEMO,
    },
    app: {
      titulo: "Solicitud no aprobada",
      cuerpo: "Tu solicitud para unirte a «{{nombreSan}}» no fue aprobada.",
    },
    correo: {
      asunto: "Sobre tu solicitud para «{{nombreSan}}»",
      html: correoBase({
        titulo: "Tu solicitud no fue aprobada",
        preheader: "Sobre tu solicitud de unión",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Tu solicitud para unirte a <strong>«{{nombreSan}}»</strong> no fue aprobada por el organizador.</p>" +
          "<p style='margin:0;'>Si crees que es un error, comunícate con quien organiza el san.</p>",
        ctaTexto: "Ver mis ahorros",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "san_iniciado",
    nombre: "San iniciado (participante)",
    descripcion: "Cuando el organizador inicia el san y se sortean los turnos; avisa a cada participante su turno.",
    categoria: "Ahorros",
    canales: ["app", "correo"],
    variables: {
      nombreSan: "Nombre del san",
      turno: "Número de turno asignado",
      link: "Enlace al san",
    },
    datosMuestra: {
      nombreSan: "San de los amigos",
      turno: "3",
      link: LINK_DEMO,
    },
    app: {
      titulo: "🎉 ¡Empezó tu san!",
      cuerpo: "«{{nombreSan}}» ya arrancó. Tu turno para cobrar es el N.º {{turno}}.",
    },
    correo: {
      asunto: "¡Empezó «{{nombreSan}}»! Tu turno es el N.º {{turno}}",
      html: correoBase({
        titulo: "¡Tu san arrancó! 🎉",
        preheader: "Ya se sortearon los turnos",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'><strong>«{{nombreSan}}»</strong> ya inició y se sortearon los turnos.</p>" +
          "<p style='margin:0;'>Tu turno para cobrar es el <strong>N.º {{turno}}</strong>. Mientras tanto, recuerda aportar tu cuota cada ronda.</p>",
        ctaTexto: "Ver el san",
        ctaUrl: "{{link}}",
      }),
    },
  },
  {
    clave: "kyc_recibida",
    nombre: "Verificación recibida",
    descripcion: "Al enviar el usuario su verificación de identidad (KYC).",
    categoria: "Verificación",
    canales: ["app", "correo"],
    variables: {},
    datosMuestra: {},
    app: {
      titulo: "Recibimos tu verificación 📋",
      cuerpo:
        "Estamos revisando tu identidad. La revisión puede tardar de 24 a 48 horas aproximadamente; te avisaremos por aquí y por correo. ¡Gracias por tu paciencia!",
    },
    correo: {
      asunto: "Recibimos tu verificación — Green Sol",
      html: correoBase({
        titulo: "Recibimos tu verificación 📋",
        preheader: "Estamos revisando tu identidad",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Recibimos tus documentos y estamos <strong>revisando tu identidad</strong>.</p>" +
          "<p style='margin:0;'>La revisión puede tardar de <strong>24 a 48 horas</strong>. Te avisaremos por aquí y por correo cuando haya respuesta. ¡Gracias por tu paciencia!</p>",
      }),
    },
  },
  {
    clave: "kyc_aprobada",
    nombre: "Verificación aprobada",
    descripcion: "Cuando el super-admin aprueba la verificación de identidad.",
    categoria: "Verificación",
    canales: ["app", "correo"],
    variables: {},
    datosMuestra: {},
    app: {
      titulo: "¡Verificación aprobada! 🎉",
      cuerpo:
        "Tu identidad fue verificada. Ya apareces como Verificado en tu perfil. ✅",
    },
    correo: {
      asunto: "¡Tu identidad fue verificada! 🎉",
      html: correoBase({
        titulo: "¡Verificación aprobada! 🎉",
        preheader: "Tu identidad fue verificada",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>¡Buenas noticias! Tu identidad fue <strong>verificada</strong> con éxito.</p>" +
          "<p style='margin:0;'>Ya apareces como <strong>Verificado</strong> en tu perfil.</p>",
        ctaTexto: "Ver mi perfil",
        ctaUrl: "https://greensol.creceideas.com/perfil",
      }),
    },
  },
  {
    clave: "kyc_reenvio",
    nombre: "Verificación: corregir y reenviar",
    descripcion: "Cuando se le pide al usuario reenviar (con motivo).",
    categoria: "Verificación",
    canales: ["app", "correo"],
    variables: { motivo: "Motivo de la corrección" },
    datosMuestra: { motivo: "La foto del documento se ve borrosa." },
    app: {
      titulo: "Tu verificación necesita correcciones",
      cuerpo:
        "{{motivo}} Vuelve a Configuración → Verificación para reenviarla.",
    },
    correo: {
      asunto: "Tu verificación necesita correcciones",
      html: correoBase({
        titulo: "Necesitamos que reenvíes tu verificación",
        preheader: "Una corrección y listo",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Revisamos tu solicitud y necesitamos que la corrijas:</p>" +
          "<p style='margin:0 0 12px;padding:12px;background:#FFF7E6;border-radius:10px;'><strong>{{motivo}}</strong></p>" +
          "<p style='margin:0;'>Vuelve a enviarla cuando quieras; es rápido.</p>",
        ctaTexto: "Reenviar verificación",
        ctaUrl: "https://greensol.creceideas.com/configuracion?tab=verificacion",
      }),
    },
  },
  {
    clave: "kyc_rechazada",
    nombre: "Verificación rechazada",
    descripcion: "Cuando el super-admin rechaza la verificación (con motivo).",
    categoria: "Verificación",
    canales: ["app", "correo"],
    variables: { motivo: "Motivo del rechazo" },
    datosMuestra: { motivo: "Los datos no coinciden con el documento." },
    app: {
      titulo: "No pudimos verificar tu identidad",
      cuerpo: "Motivo: {{motivo}} Si crees que es un error, contacta a soporte.",
    },
    correo: {
      asunto: "No pudimos verificar tu identidad",
      html: correoBase({
        titulo: "No pudimos verificar tu identidad",
        preheader: "Detalles de la revisión",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Revisamos tu solicitud y no pudimos aprobarla.</p>" +
          "<p style='margin:0 0 12px;padding:12px;background:#FDECEC;border-radius:10px;'><strong>{{motivo}}</strong></p>" +
          "<p style='margin:0;'>Si crees que es un error, contacta a soporte.</p>",
      }),
    },
  },
  {
    clave: "kyc_baneada",
    nombre: "Verificación: cuenta suspendida",
    descripcion: "Cuando el super-admin rechaza y banea por fraude/suplantación.",
    categoria: "Verificación",
    canales: ["app", "correo"],
    variables: {},
    datosMuestra: {},
    app: {
      titulo: "Tu cuenta fue suspendida",
      cuerpo:
        "Detectamos una irregularidad en tu verificación. Contacta a soporte.",
    },
    correo: {
      asunto: "Tu cuenta fue suspendida",
      html: correoBase({
        titulo: "Tu cuenta fue suspendida",
        preheader: "Contacta a soporte",
        cuerpoHtml:
          "<p style='margin:0 0 12px;'>Detectamos una irregularidad en tu proceso de verificación y <strong>suspendimos tu cuenta</strong>.</p>" +
          "<p style='margin:0;'>Si crees que es un error, contacta a soporte.</p>",
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
