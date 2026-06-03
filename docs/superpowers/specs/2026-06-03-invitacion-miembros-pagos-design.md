# Invitación con solicitud, pestaña Miembros y Pagos simplificada — Diseño

**Fecha:** 2026-06-03
**Estado:** Aprobado (dirección). Se pule en la implementación viendo cada pantalla.
**Alcance:** Tres piezas sobre el detalle del san ya existente (v0.0.106). NO toca cripto, SMTP ni otras revisiones pendientes.

## Contexto

El detalle del san (`app/(app)/sanes/[id]/page.tsx`) ya usa `PanelTabs` con dos pestañas **Resumen · Pagos** y componentes en `components/san/`. Hoy:

- **Unirse une directo:** `unirseARecolecta` (`app/(app)/sanes/actions.ts:171`) crea el `Participante` al instante, sin importar `visibilidad` (privado/público) — solo verifica `estado === "abierta"`. No hay flujo de solicitud/aprobación. Esto es un fallo de diseño: en un san privado, cualquiera con el enlace entra.
- **El "código" compartido es el `id` (cuid):** `CompartirAhorro codigo={r.id}` y `limpiarCodigo` extraen el cuid de la URL. No hay códigos cortos ni invitaciones con vencimiento.
- **La notificación de unión** usa la etiqueta "Nombre Apellido (@usuario)" (`actions.ts:196`). Se pide invertir a "@usuario (Nombre Apellido)" en notificaciones.
- **`PanelTabs`** (`components/panel-tabs.tsx`) recibe `tabs: string[]`; no soporta indicador/badge por pestaña.

Las tres piezas:

- **A** — Invitación temporal + solicitud de unión + notificaciones del flujo.
- **B** — Reestructura del detalle a tres pestañas Resumen · Miembros · Pagos.
- **C** — Formato `@usuario (Nombre Apellido)` en notificaciones (transversal, va con A).

---

## Pieza A — Invitación + solicitud de unión

### Datos (migración Prisma)

**Modelo nuevo `Invitacion`:**

| campo | tipo | nota |
|---|---|---|
| `id` | String cuid | PK |
| `recolectaId` | String | FK → Recolecta (onDelete Cascade) |
| `codigo` | String @unique | corto, 6 caracteres, alfabeto sin ambiguos (sin `0/O/1/I/L`) |
| `creadaPor` | String | FK → Usuario (el organizador) |
| `expiraEn` | DateTime | vencimiento |
| `revocada` | Boolean @default(false) | el organizador puede revocar |
| `creadaEn` | DateTime @default(now()) | |

Una invitación es **válida** si `!revocada && expiraEn > now()`. El organizador elige el vencimiento al generar: **1 / 7 / 30 días (default 7)**.

**Modelo nuevo `SolicitudUnion`:**

| campo | tipo | nota |
|---|---|---|
| `id` | String cuid | PK |
| `recolectaId` | String | FK → Recolecta (onDelete Cascade) |
| `usuarioId` | String | FK → Usuario |
| `estado` | enum `EstadoSolicitud` | `pendiente` / `aprobada` / `rechazada` |
| `creadaEn` | DateTime @default(now()) | |
| `resueltaEn` | DateTime? | |

`@@unique([recolectaId, usuarioId])` para evitar solicitudes duplicadas (re-solicitar reusa/reabre la fila). Las solicitudes pendientes **no** son `Participante`: la lista de miembros queda limpia hasta aprobar.

### Comportamiento

- **Generar invitación** (organizador, acción nueva `generarInvitacion(recolectaId, diasVigencia)`): crea `Invitacion` con código corto único y `expiraEn`. Devuelve el código y el enlace `/i/<codigo>`. El organizador puede tener varias activas y **revocarlas** (`revocarInvitacion`).
- **Ruta `/i/[codigo]`** (page nueva): resuelve la invitación.
  - inválida (no existe / vencida / revocada) → "Este enlace de invitación ya no es válido."
  - válida + sin sesión → manda a login y vuelve al enlace.
  - válida + con sesión → pantalla **"Solicitar unirse a [nombre del san]"** con un resumen mínimo del san y un botón.
- **Al pulsar el botón** (`solicitarUnion`):
  - san **público** → unión directa (crea `Participante` + turno, como hoy).
  - san **privado** → crea/reabre `SolicitudUnion` en `pendiente`, notifica al organizador. NO crea `Participante`.
  - ya es miembro / ya tiene solicitud pendiente → mensaje claro, sin duplicar.
- **Invitación nominal por correo/@usuario** (`invitarPorCorreo` existente): la persona nombrada entra **directo** al unirse (el organizador la designó). Se mantiene el comportamiento actual.
- **Resolver solicitud** (organizador, `resolverSolicitud(solicitudId, aprobar)`):
  - aprobar → `SolicitudUnion.estado = aprobada`, crea `Participante` (+ turno si aplica), notifica al solicitante.
  - rechazar → `estado = rechazada`, notifica al solicitante.
- **San cerrado/cancelado/culminado:** deja de aceptar solicitudes y uniones (ya existe el check `estado !== "abierta"`). La URL del san sigue viva para ver el historial; no se renombra ni se "libera".

### Notificaciones (incluye Pieza C)

Eventos nuevos en `lib/correo/catalogo.ts` (app + correo, plantillas de marca):

- `san_solicitud_union` → **organizador**: "**@usuario (Nombre Apellido)** solicitó unirse a **[san]**. Revísalo."
- `san_solicitud_aceptada` → **solicitante**: "Te aceptaron en **[san]**."
- `san_solicitud_rechazada` → **solicitante**: "Tu solicitud para **[san]** no fue aprobada."

**Formato de identidad en notificaciones:** `@usuario (Nombre Apellido)` (usuario primero). Se ajusta también la etiqueta del evento de unión existente. Si falta `@usuario`, cae a "Nombre Apellido"; si falta todo, al correo. (En la **fila de participante** el orden es el inverso —`Nombre Apellido` y `@usuario` debajo— y eso ya está bien; no se toca.)

---

## Pieza B — Detalle en tres pestañas: Resumen · Miembros · Pagos

Reusar `PanelTabs`, **extendido** para aceptar un indicador opcional por pestaña (puntito de aviso). Cambio mínimo: aceptar `avisos?: boolean[]` (un punto por índice) o permitir `tabs` como `ReactNode[]`. Se elige `avisos?: boolean[]` para no romper los usos actuales.

### Resumen (general y compacto)
- Cabecera (nombre, estado, chip de rol) + **dona de progreso** "Ronda X de Y".
- **Invitar / compartir** (si el san está abierto): muestra el **código corto** y el enlace `/i/<codigo>`, con botón **Generar invitación** (elige vigencia) y lista de invitaciones activas con opción de revocar.
- Vista general; el detalle fino vive en Miembros y Pagos.

### Miembros
- **Solicitudes pendientes** (solo organizador, arriba): cada una con `FilaParticipante` del solicitante + **Aprobar / Rechazar**. Si hay ≥1 pendiente, la **pestaña Miembros muestra un puntito de aviso**.
- **Participantes:** lista con `FilaParticipante` (`Nombre Apellido` + `@usuario`, organizador en dorado), su **turno**, el **estado de pago de la ronda** (pagó/pendiente) y la **fecha del último pago**. Progreso por participante visible aquí.

### Pagos (simplificada)
- **Arriba: Método de pago** en **tarjeta visual** (datos de `DatosPagoRecolecta`: banco, teléfono, titular, cédula / wallet). Reemplaza el bloque "¿dónde pagar?" que hoy vive en el Resumen.
- **Abajo, según rol** (lo que ya existe, reubicado):
  - participante → "lo que te toca pagar" (Bs↔$) + reportar pago + mi historial.
  - organizador → sub-pestañas Pendientes / Aprobados (aprobar/rechazar pagos).

---

## Componentes y archivos

**Nuevos:**
- `prisma/schema.prisma` — modelos `Invitacion`, `SolicitudUnion`, enum `EstadoSolicitud` (+ migración).
- `app/i/[codigo]/page.tsx` — landing de invitación → solicitar unirse.
- `components/san/miembros.tsx` — pestaña Miembros (participantes + solicitudes pendientes).
- `components/san/metodo-pago-tarjeta.tsx` — tarjeta visual del método de pago.
- `components/san/invitar.tsx` — generar/listar/revocar invitaciones + mostrar código y enlace.

**Modificados:**
- `app/(app)/sanes/actions.ts` — `generarInvitacion`, `revocarInvitacion`, `solicitarUnion`, `resolverSolicitud`; ajustar `unirseARecolecta` (público=directo, privado=solicitud).
- `app/(app)/sanes/[id]/page.tsx` — tres pestañas con `avisos` (puntito en Miembros).
- `components/panel-tabs.tsx` — soporte `avisos?: boolean[]`.
- `components/san/resumen-san.tsx` — mover "¿dónde pagar?" a Pagos; integrar invitar.
- `lib/correo/catalogo.ts` — eventos `san_solicitud_union` / `_aceptada` / `_rechazada`; formato `@usuario (Nombre Apellido)`.

## Verificación

- Migración aplicada (`migrate diff` + `migrate deploy` + `generate`) y **dev server reiniciado** (el cliente Prisma queda viejo si no).
- `tsc --noEmit` limpio por fase.
- E2E (`npm run test:e2e`, base `greensol_test`): extender `autenticado.spec.ts` o nuevo `san-invitacion.spec.ts` — generar invitación, abrir `/i/<codigo>` con un segundo usuario, solicitar, aprobar como organizador, verificar que aparece en Miembros. Determinista, dos contextos como `kyc-integral.spec.ts`.
- Documentar al cierre: `CHANGELOG.md`, `docs/PRD.md`/`.html`, `docs/ARQUITECTURA_TECNICA.md`. Versionar por incremento (0.0.x).

## Fuera de alcance

Cripto/wallet, SMTP real, incentivos/modelo de negocio, y el resto de pendientes del PRD. Acortador de URL público y analítica de invitaciones tampoco (la `Invitacion` con vencimiento ya cubre el control).
