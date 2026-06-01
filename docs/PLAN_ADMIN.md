# Plan — Gestión super-admin de usuarios y notificaciones

Visión pedida por Luis (2026-05-31). El panel super-admin actual de usuarios es
muy básico ("no se entiende"); se rediseña a **tarjetas** con detalle y acciones.

## Listado de usuarios (tarjetas)
- **Tarjeta por usuario** con datos básicos: **nombre y apellido**, **@usuario**,
  **correo**, **teléfono** (si lo agregó), nivel/estado.
- Acciones en la tarjeta: **👁 ver** (abre detalle) y **✏️ editar**.

## Detalle del usuario (pop-up al ver)
- **Actividad:** en cuántos san/vaca ha **participado**, en cuáles está activo,
  histórico por periodo.
- **Intentos de cambio:** cuántas veces intentó cambiar **contraseña**, **correo**,
  **nombre**, **nombre de usuario** (auditoría).
- **Documentación (KYC):** qué documentos subió, si los actualizó, estado de la
  verificación (ver [PLAN_KYC.md](PLAN_KYC.md)).
- **Reputación**, fecha de registro, último ingreso.

## Acciones del super-admin sobre un usuario
- **Editar** datos del perfil (p. ej. corregir un **nombre inapropiado**).
- **Restringir / sancionar** la cuenta; **pedir que cambie** un dato vía
  notificación in-app.
- **Cambiar rol** (ya existe).
- **Banear** (relacionado con KYC: suplantación, fraude).

## Reglas
- **Cambio de nombre de usuario:** permitido **solo cada 30–60 días** (anti-abuso).
- Lista negra de palabras en nombre/apellido/usuario (ya existe).

## Notificaciones personalizadas (broadcast / segmentadas)
Ya conversado; encaja con el [catálogo de plantillas](PLAN_NOTIFICACIONES.md):
- El super-admin **redacta una notificación** y elige el **alcance**:
  **global** (todos), **un usuario** concreto, o **un grupo/segmento**.
- **Canal:** in-app y/o correo.
- Útil para avisos del servicio, advertencias de moderación, campañas.

## Teléfono como factor adicional
- Agregar **teléfono** en Configuración → Verificación/Seguridad como dato y
  posible **2FA** (código por **SMS** o **WhatsApp** vía Evolution API a futuro;
  ver [PLAN_SEGURIDAD.md](PLAN_SEGURIDAD.md)).
