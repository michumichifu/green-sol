# Plan — Sistema de notificaciones y plantillas editables

Visión pedida por Luis (2026-05-31), tras dejar el SMTP funcionando.
Referencia de UI/editor: su proyecto **Panel Dental** (config de clínica →
comunicaciones), que tiene un editor visual de plantillas.

## Canales
- **En-app**: campanita / desplegable de avisos (ya existe el modelo `Notificacion`).
- **Correo (HTML)**: usa el SMTP ya configurado (`lib/mailer.ts`, `notificarYCorreo`).
- **Futuro**: notificaciones **push**; y **WhatsApp** vía Evolution API (recordatorios
  de pago, OTP, etc.). Hoy NO se usa WhatsApp; la gente usa la app + correo.

## Catálogo de eventos (notificaciones predeterminadas)
Cada evento tiene su versión **app** y su versión **correo**:
- Correo verificado.
- Código **OTP** (verificación de cuenta y de acciones sensibles).
- Método de pago **agregado** / **editado** / **eliminado**.
- **San creado** (con datos del san + código de invitación + link).
- **Alguien se unió** a tu san (aviso al organizador).
- (Se sumarán: pago reportado/confirmado/rechazado, sorteo de turnos, cierre, etc.)

## UI en super-admin (estilo Panel Dental, pensado para escritorio)
- **Listado** de notificaciones; cada fila con dos iconos: **👁 ojito** (previsualizar)
  y **✏️ lápiz** (editar).
- **Preview** (ojito): abre un popup con **dos pestañas — Aplicación · Correo** — con
  el render real de cada una. Dentro del popup, botón **lápiz** para editar la que
  corresponda.
- **Editor visual** distinto por canal:
  - **Correo** → editor de **plantilla HTML** (con lo necesario para enviar mail bien).
  - **App** → editor **simple** (texto/markdown).
- **Variables/placeholders** por evento: `{usuario}`, `{nombreSan}`,
  `{codigoInvitacion}`, `{link}`, `{datosPago}`, etc.

## Modelo de datos (propuesto)
`PlantillaNotificacion`: `clave` (evento) · `canal` (app|correo) · `asunto?` ·
`cuerpo` (texto o HTML) · `activa`. El código resuelve la plantilla por
(`clave`,`canal`), rellena variables y usa un **texto por defecto** si no hay
plantilla guardada (así nunca se rompe).

## Flujo del san con validación (relacionado — bloque san)
- El san se puede **guardar como borrador**.
- Para **publicar/crear**: **validación de seguridad** = clave de la cuenta + un
  **código** (OTP por correo ahora; PIN/WhatsApp a futuro), vía
  `verificarFactores` (ver [PLAN_SEGURIDAD.md](PLAN_SEGURIDAD.md)).
- Al crear: notificación **app + correo** "¡Creaste tu san!" con los datos del san,
  el **código de invitación** y el **link** para compartir.
- Cuando alguien **se une** por enlace/código: notificación **app + correo** al
  **organizador** ("Fulano se unió a tu san").

## Orden sugerido (incremental)
1. **Notificaciones del san** (crear con validación clave+OTP, y unión) con textos en
   código + correo por SMTP (ya funciona). — encaja en el bloque "san".
2. Modelo `PlantillaNotificacion` + resolución desde código con fallback por defecto.
3. UI super-admin: **listado + preview** (pestañas app/correo).
4. **Editores visuales** (HTML para correo, simple para app).
5. **Push** y **WhatsApp** (Evolution API) — fase posterior.
