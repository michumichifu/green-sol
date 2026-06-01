# Verificación de identidad (KYC) — Diseño

**Fecha:** 2026-05-31
**Autor:** Luis (Green Sol) + Claude
**Estado:** Aprobado (diseño), pendiente plan de implementación

## Contexto y origen

Green Sol necesita un proceso de verificación de identidad (KYC) **manual**,
revisado por el super-admin, como primer paso antes de integrar a futuro un
proveedor tercero semiautomatizado.

El diseño se inspiró en el repositorio open-source **TrustFlow_KYC**
(`AbhiEE03/TrustFlow_KYC`, Django + React) que valida el flujo conceptual
(máquina de estados borrador→enviado→en revisión→aprobado/rechazado/más-info,
cola del revisor, validación de archivos). **No se reutiliza su código** (otro
stack: Django/Python; documentos indios PAN/Aadhaar; sin licencia explícita —
queda pendiente pedir al autor que añada una licencia MIT). Se **porta el
patrón** nativo al stack de Green Sol (Next.js 16 + Prisma + Postgres +
TypeScript), evitando un segundo servicio y los puentes de identidad/archivos/
notificaciones que exigiría conectarlo por API.

## Objetivo

Que un usuario pueda **verificar su identidad** subiendo documento + selfie +
video de liveness; que el **super-admin revise manualmente** y apruebe, rechace,
solicite reenvío o banee; y que el resultado se refleje en el perfil
(tag "Verificado") y, a futuro, desbloquee límites/funciones.

## Decisiones clave (acordadas)

1. **Nativo, no microservicio.** Se construye dentro de Green Sol como módulo
   aislado, no como app Django separada conectada por API.
2. **Almacenamiento: MinIO** (S3-compatible, self-hosted) en Docker local y en el
   VPS. Acceso vía SDK de S3 (`@aws-sdk/client-s3`) con **URLs firmadas
   temporales**. Migrable a Cloudflare R2 / AWS S3 sin cambiar código. Los
   archivos privados **nunca** se sirven desde `/public`.
3. **Liveness manual.** El video se graba en el navegador con instrucciones en
   pantalla y lo **revisa un humano** (super-admin). **No** hay detección
   automática de gestos (sin ML).
4. **Proceso configurable por toggles**, no niveles rígidos. El super-admin
   enciende/apaga cada paso requerido. Por ahora: documento + selfie + video
   activos; dirección/residencia desactivada.
5. **Verificado / no verificado.** Se colapsan los niveles 1/2. El campo
   `nivelKyc` (entero) se conserva (`0` = no verificado, `1` = verificado) para
   dejar la puerta abierta a niveles con límites en el futuro.

## Modelo de datos (Prisma)

### Nuevo modelo `VerificacionKyc`

Una fila por **intento** (relación uno-a-muchos con Usuario) para conservar
historial cuando se rechaza y el usuario reenvía.

```prisma
model VerificacionKyc {
  id              String         @id @default(cuid())
  usuarioId       String
  usuario         Usuario        @relation("verificaciones", fields: [usuarioId], references: [id], onDelete: Cascade)

  // Documento de identidad
  tipoDocumento   TipoDocumento?
  nacionalidad    Nacionalidad?   // solo aplica si tipoDocumento = cedula
  numeroDocumento String?
  docFrenteKey    String?         // clave del objeto en MinIO (anverso)
  docReversoKey   String?         // reverso (obligatorio para cédula; opcional pasaporte)
  selfieKey       String?
  videoKey        String?         // liveness 7-10 s

  // Dirección / residencia (solo si el paso está activo)
  direccion       String?
  ciudad          String?
  estadoRegion    String?         // "estado" colisiona con el enum EstadoKyc

  // Revisión
  estado          EstadoKyc       @default(pendiente)
  motivoRechazo   String?         // mostrado al usuario
  notaInterna     String?         // solo super-admin
  revisadoPorId   String?
  revisadoPor     Usuario?        @relation("revisor", fields: [revisadoPorId], references: [id])
  creadaEn        DateTime        @default(now())
  revisadaEn      DateTime?
}

enum TipoDocumento { cedula  pasaporte }
enum Nacionalidad  { V  E }
enum EstadoKyc { pendiente  en_revision  aprobada  rechazada  reenvio_solicitado  baneada }
```

### Cambios en `Usuario`

```prisma
nivelKyc           Int      @default(0)   // 0 = no verificado, 1 = verificado
baneado            Boolean  @default(false)
telefono           String?
telefonoVerificado Boolean  @default(false)
verificaciones     VerificacionKyc[] @relation("verificaciones")
verificacionesRevisadas VerificacionKyc[] @relation("revisor")
```

(El `fotoUrl` ya existe en el schema; se podrá poblar con la foto de perfil más
adelante — fuera del alcance de este KYC.)

## Pasos configurables (ConfiguracionApp)

Toggles guardados en el key-value `ConfiguracionApp` existente, editables desde
el validador KYC del super-admin:

| Clave | Por defecto | Paso |
|---|---|---|
| `KYC_REQUIERE_DOCUMENTO` | `true`  | Documento de identidad (anverso/reverso) |
| `KYC_REQUIERE_SELFIE`    | `true`  | Selfie frontal |
| `KYC_REQUIERE_VIDEO`     | `true`  | Video de liveness |
| `KYC_REQUIERE_DIRECCION` | `false` | Dirección / residencia |

El flujo del usuario muestra solo los pasos activos. Encender "dirección" no
requiere cambios de código.

## Máquina de estados

```
pendiente ──→ en_revision ──→ aprobada
                           ──→ rechazada
                           ──→ reenvio_solicitado ──(usuario reenvía)──→ (nuevo intento) pendiente
                           ──→ baneada
```

- **pendiente**: enviada, espera revisión.
- **en_revision**: un super-admin la "tomó" (evita doble revisión).
- **aprobada** *(final)*: `usuario.nivelKyc = 1`.
- **rechazada** *(final)*: sin reenvío, con motivo.
- **reenvio_solicitado**: el usuario puede subir de nuevo → crea un nuevo intento
  `pendiente`.
- **baneada** *(final)*: `usuario.baneado = true`, bloquea la cuenta
  (suplantación/fraude).

Las transiciones inválidas (saltar revisión, reactivar baneada, etc.) se
**bloquean en el Server Action** mediante un diccionario de transiciones
permitidas, equivalente a `transition_state()` de TrustFlow pero en TypeScript.

## Flujo del usuario (asistente)

Entrada: **Configuración → Verificación → "Verificación de identidad (KYC)"**.
Asistente por pasos (patrón de pasos deslizantes ya existente en crear-san),
mostrando solo los pasos activos:

1. **Documento:** tipo (cédula/pasaporte); si cédula, prefijo V/E + número; sube
   **anverso** y **reverso** (reverso solo si cédula).
2. **Selfie:** foto frontal de la cara.
3. **Video liveness:** graba 7-10 s con `MediaRecorder` siguiendo instrucciones en
   pantalla (pestañear → abrir la boca 3 veces → mano frente a la cara con 3 dedos).
4. **Revisar y enviar** → solicitud en estado `pendiente`.

Estados visibles para el usuario:
- Con solicitud `pendiente`/`en_revision`: banner **"En revisión"** (ámbar); no
  puede reenviar.
- Con `reenvio_solicitado`: el asistente se reabre mostrando el **motivo** arriba.
- Con `aprobada`: tag **Verificado** (verde) y paso completado con ✓.

### Subida de archivos

El navegador pide al servidor una **URL firmada de subida** (Server Action que
valida sesión + tipo/tamaño: imágenes ≤ 5 MB, video ≤ 20 MB), sube **directo a
MinIO**, y envía al servidor solo las *keys*. Los archivos no pasan por `/public`.

## Cola de revisión (super-admin)

Nueva pestaña **"Verificaciones"** con sub-listas **Pendientes · Aprobadas ·
Rechazadas** (usando `PanelTabs`). Por solicitud:

- Muestra documento (anverso/reverso), selfie y video con **URLs firmadas
  temporales** (solo el super-admin las obtiene).
- **Tomar** → `en_revision` (evita doble revisión).
- Acciones: **Aprobar** · **Rechazar con motivo** · **Solicitar reenvío (con
  motivo)** · **Rechazar y banear**.
- **Nota interna** (solo super-admin; no se muestra al usuario).
- Muestra **solo la última solicitud por usuario** (consulta tipo `Max(id)` /
  `distinct` por usuario, como TrustFlow).
- En esta misma pestaña viven los **toggles** de pasos requeridos.

## Notificaciones e indicadores

- Cada cambio de estado dispara **`notificarYCorreo`** (app + correo) con el
  catálogo de plantillas existente:
  - recibida → "Recibimos tu verificación".
  - aprobada → "¡Verificación aprobada! 🎉".
  - reenvío → "Tu verificación necesita correcciones: {motivo}".
  - rechazada → "No pudimos verificar tu identidad: {motivo}".
  - baneada → "Tu cuenta fue suspendida".
- Al aprobar: `nivelKyc = 1` → tag **Verificado** verde junto al apodo; sección
  Verificación con ✓.
- Indicadores: pasos completados en **verde**, pendientes en **ámbar**.

## Orden de construcción (dependencias)

1. **MinIO** (Docker local + VPS) + helper de subida / URLs firmadas
   (`@aws-sdk/client-s3`).
2. **Modelo Prisma** `VerificacionKyc` + campos en `Usuario` + migración +
   regenerar cliente + reiniciar `next dev`.
3. **Máquina de estados** (Server Actions con diccionario de transiciones).
4. **UI del usuario** (asistente de subida con `MediaRecorder`).
5. **Cola del super-admin** (pestaña Verificaciones + toggles).
6. **Notificaciones + indicadores** (plantillas, tag Verificado).

## Fuera de alcance (futuro)

- Proveedor KYC tercero (Sumsub, Veriff, MetaMap) para OCR + liveness automático.
- Detección automática de gestos / anti-spoofing por ML.
- Niveles con límites por monto.
- Verificación de teléfono por WhatsApp/SMS (Evolution API).
- Foto de perfil del usuario (poblar `fotoUrl`).
- Verificación de residencia con comprobante.

## Notas de seguridad

- Credenciales de MinIO (access key/secret) van en variables de entorno, **nunca**
  al repo (ver `secretos-y-apis-privadas-fuera-del-repo`).
- Bucket **privado**; todo acceso vía URL firmada de corta expiración.
- Solo el dueño de la solicitud y el super-admin pueden generar URLs firmadas de
  lectura de sus archivos.
- Pendiente legal: pedir al autor de TrustFlow_KYC que añada una licencia MIT
  antes de tomar cualquier fragmento de su código (el diseño/idea es libre).
