# Plan — Verificación de identidad (KYC) manual

Visión pedida por Luis (2026-05-31). KYC **manual** revisado por super-admin como
primer paso, mientras se integra luego un **proveedor tercero** semiautomatizado.
Es un bloque grande: depende de **almacenamiento de archivos** (MinIO/S3 en la
VPS — ver [INTEGRACIONES_API.md] / despliegue) y de un panel de revisión.

## Pasos del proceso de verificación (referencia: Apolo Pay)
De Apolo Pay (CEX venezolano) se toma la **lógica/estructura** (niveles,
requisitos, límites, indicadores), no la estética.

### Pasos previos (cuenta básica)
- **Correo verificado:** al registrarse se envía un correo de verificación (hoy
  es OTP de 6 dígitos; a futuro un **enlace** de verificación). **Reenviable una
  vez cada 2 minutos.** Si ya verificó, no se reenvía; el **super-admin** puede
  **restaurar** y exigir re-verificar.
- **Teléfono:** el usuario **agrega** su número (con prefijo de país). La
  **verificación** del teléfono es aparte y **futura**: código OTP por
  **Evolution API** (WhatsApp/SMS).

### Niveles de operación (KYC)
- **Nivel 1 — básico:** **información personal básica** + **dirección/residencia**
  → desbloquea **límites bajos** (tope por transacción y total acumulado).
- **Nivel 2 — avanzado:** **documento de identidad** (cédula/pasaporte) +
  **verificación biométrica** (foto frontal + video de liveness) → **límites
  altos** y funciones extra (p. ej. P2P).
- Documentos en Venezuela (residencia/identidad): **cédula** o **pasaporte**,
  **RIF**, **carta del CNE** o **carta de residencia** (alcaldía).

> Los montos exactos por nivel se definen con producto (Apolo usa ~400 USDT en
> N1 y ~10 000 / 50 000 USDT en N2 como referencia).

## Indicadores en el perfil
- Tag **"Verificado"** (verde) junto a la foto/apodo al alcanzar un nivel.
- En la sección Verificación: pasos **completados con ✓ verde**; pendientes en
  **ámbar/naranja** ("por registrar / por resolver"). Correo y teléfono
  verificados muestran su propio ✓.

## Edición de perfil
- El usuario puede **editar** sus datos y **subir su foto de perfil** (botón
  circular junto al apodo; foto real o la que desee).
- **Una vez verificado**, **no puede editar nombre ni apellido** (quedan fijos);
  el **correo** sí, con re-verificación. El **nombre de usuario** solo cada
  30–60 días (ver [PLAN_ADMIN.md](PLAN_ADMIN.md)).

## Prueba de vida (liveness, anti-spoofing)
Video corto de **5–7 segundos** con gestos guiados, para evitar fotos/videos
ajenos: **pestañear → abrir la boca → mostrar 3 dedos frente a la cara**.

## Flujo del usuario
1. En **Configuración → Verificación**, el ítem "Verificación de identidad (KYC)"
   abre el proceso: subir documento + foto frontal + video de liveness.
2. Los archivos se suben a **nuestro servidor** (bucket privado MinIO/S3).
3. Queda en estado **pendiente**.

## Panel super-admin (revisión manual)
- Sección **"Verificaciones"** con listas: **pendientes**, **aprobadas**,
  **rechazadas**.
- Por solicitud: ver documento, foto y video; **aprobar** o **rechazar con motivo**
  (p. ej. "la foto no se ve bien, reenvía") o **solicitar reenvío**.
- **Estados:** `pendiente` · `aprobada` · `rechazada` · `reenvio_solicitado` ·
  `baneada`.
- **Acciones del revisor:**
  - **Aprobar** (sube el nivel KYC del usuario).
  - **Rechazar y reenviar** (motivo: "foto borrosa", etc. → puede volver a subir).
  - **Rechazar** (sin reenvío).
  - **Rechazar y banear** — cuando se detecta **suplantación de identidad**,
    infracción de normas o algo muy sospechoso. Bloquea la cuenta.
  - **Notas internas** (por qué se aprueba/rechaza/banea) — solo super-admin.
- Al **aprobar/rechazar/banear** → notificación **in-app + correo** al usuario
  (con el motivo si aplica). Usa el catálogo de plantillas
  ([PLAN_NOTIFICACIONES.md](PLAN_NOTIFICACIONES.md)).
- El **estatus de verificación se refleja en el perfil del usuario** y, a futuro,
  **desbloquea funcionalidades** (montos/límites, retiros, etc.) según el nivel.

## Modelo de datos (propuesto)
`VerificacionKyc`: `usuarioId` · `nivel` (1|2) · `tipoDocumento`
(cedula|pasaporte|rif|cne|carta_residencia) · `documentoUrl` · `fotoUrl` ·
`videoUrl` · `estado` · `motivoRechazo?` · `revisadoPorId?` · `creadaEn` ·
`revisadaEn?`. Campo en `Usuario`: `nivelKyc` (0 por defecto).

## Pendiente / dependencias
- **Almacenamiento privado** de archivos (MinIO/S3 en la VPS) — requisito previo.
- Subida segura (URLs firmadas, acceso solo super-admin).
- A futuro: **proveedor KYC** (Sumsub, Veriff, MetaMap, etc.) para automatizar
  OCR + liveness + verificación, dejando lo manual como respaldo.
