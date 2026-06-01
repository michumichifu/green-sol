# KYC — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el KYC completo de Green Sol (front + back + seguridad + DB + almacenamiento de archivos) según la spec `docs/superpowers/specs/2026-05-31-kyc-verificacion-identidad-design.md`, y dejar una beta desplegada en el VPS-2.

**Architecture:** Módulo nativo en Next.js 16 + Prisma + Postgres. Almacenamiento de archivos privado vía abstracción S3 (`@aws-sdk/client-s3`) que en producción apunta a MinIO y en local cae a almacenamiento en disco si no hay MinIO. Máquina de estados validada en Server Actions. Cola de revisión en el panel super-admin. Notificaciones app+correo reutilizando `notificarYCorreo`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 6 + Postgres, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, MinIO, `MediaRecorder` (liveness), Playwright (QA E2E), Docker Compose + nginx + certbot (despliegue VPS-2).

## Ciclo por fase (lo pedido por Luis)

Cada fase termina con, en este orden:
1. **Verificar:** `timeout 150 npx tsc --noEmit | grep "error TS"` limpio (no `next build` con dev activo).
2. **Commit** con versión `0.0.x` + entrada en `CHANGELOG.md`.
3. **Docs:** actualizar `docs/PRD.md`, `docs/PRD.html` y `docs/ARQUITECTURA_TECNICA.md` con lo construido en la fase.
4. **QA E2E Playwright** sobre la fase (usuario de prueba propio, ver Fase 0).
5. **Deploy VPS:** la infra se monta una vez en la **Fase 6**; a partir de ahí cada fase posterior re-despliega con `git pull + rebuild`. (Construir y desplegar a producción una feature a medias no aporta a la beta; por eso el primer montaje del VPS va cuando el KYC ya es funcional, y los re-deploys siguen el ciclo.)

---

## Fase 0 — Almacenamiento de archivos + usuario de prueba

**Files:**
- Create: `lib/almacenamiento.ts` (abstracción de subida/lectura)
- Create: `prisma/seed-dev.ts` (usuario de prueba local)
- Modify: `package.json` (deps + script seed)
- Modify: `.env` / `.env.local` (vars MinIO — NO al repo)
- Modify: `docs/DESPLIEGUE_VPS.md` (vars MinIO de producción)

- [ ] **Step 1: Instalar SDK S3**

Run: `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

- [ ] **Step 2: Levantar MinIO local**

Intentar Docker; si `docker` no existe en PATH, usar binario nativo:
```bash
# opción binario (sin docker):
mkdir -p ~/minio/data && cd ~/minio
curl -sSLo minio https://dl.min.io/server/minio/release/linux-amd64/minio && chmod +x minio
MINIO_ROOT_USER=greensol MINIO_ROOT_PASSWORD=greensol_dev ./minio server ~/minio/data --console-address ":9011" &
```
Crear bucket `greensol-kyc` (privado) vía consola `:9011` o `mc`.

- [ ] **Step 3: Variables de entorno** (en `.env.local`, NUNCA al repo)

```
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=greensol
S3_SECRET_KEY=greensol_dev
S3_BUCKET=greensol-kyc
S3_FORCE_PATH_STYLE=true
```

- [ ] **Step 4: Helper de almacenamiento** — `lib/almacenamiento.ts`

Interfaz mínima (contrato que usan las fases siguientes):
```ts
// subirArchivo: sube un Buffer/Blob y devuelve la KEY (no URL)
export async function subirArchivo(key: string, cuerpo: Buffer, contentType: string): Promise<string>
// urlFirmadaLectura: URL temporal (default 300 s) para ver un objeto privado
export async function urlFirmadaLectura(key: string, expiraSeg?: number): Promise<string>
// urlFirmadaSubida: URL PUT temporal para que el navegador suba directo
export async function urlFirmadaSubida(key: string, contentType: string, expiraSeg?: number): Promise<string>
// borrarArchivo(key)
```
Implementación con `S3Client` (forcePathStyle, endpoint, credenciales de env). Si faltan las env de S3 → fallback a disco local en `.almacen/` (fuera de `public/`) sirviendo por route handler autenticado, para no bloquear el dev sin MinIO.

- [ ] **Step 5: Usuario de prueba propio** — `prisma/seed-dev.ts`

Crea (idempotente, upsert por correo) un super-admin de pruebas:
- correo `qa@greensol.local`, clave `GreenSolQA2026!`, rol `super_admin`, `correoVerificado=true`, nombre/apodo de prueba.
Script en `package.json`: `"seed:dev": "tsx prisma/seed-dev.ts"`. Documentar credenciales en `_privado/` (no al repo).

- [ ] **Step 6: Verificar + commit**

`timeout 150 npx tsc --noEmit | grep "error TS"` → limpio.
```bash
git add lib/almacenamiento.ts prisma/seed-dev.ts package.json package-lock.json
git commit -m "feat(kyc): almacenamiento S3/MinIO + usuario de prueba dev (v0.0.49)"
```

- [ ] **Step 7: Docs Fase 0** — PRD/PRD.html/ARQUITECTURA: sección "Almacenamiento de archivos privados".

- [ ] **Step 8: QA** — `npm run seed:dev` y verificar login con el usuario QA en Playwright (reusar `e2e/autenticado.spec.ts`).

---

## Fase 1 — Modelo de datos + migración

**Files:**
- Modify: `prisma/schema.prisma`
- Migration: `prisma/migrations/<ts>_kyc/`

- [ ] **Step 1: Añadir enums y modelo** (al final de `schema.prisma`)

```prisma
enum TipoDocumento { cedula  pasaporte }
enum Nacionalidad  { V  E }
enum EstadoKyc { pendiente  en_revision  aprobada  rechazada  reenvio_solicitado  baneada }

model VerificacionKyc {
  id              String         @id @default(cuid())
  usuarioId       String
  usuario         Usuario        @relation("verificaciones", fields: [usuarioId], references: [id], onDelete: Cascade)
  tipoDocumento   TipoDocumento?
  nacionalidad    Nacionalidad?
  numeroDocumento String?
  docFrenteKey    String?
  docReversoKey   String?
  selfieKey       String?
  videoKey        String?
  direccion       String?
  ciudad          String?
  estadoRegion    String?
  estado          EstadoKyc      @default(pendiente)
  motivoRechazo   String?
  notaInterna     String?
  revisadoPorId   String?
  revisadoPor     Usuario?       @relation("revisor", fields: [revisadoPorId], references: [id])
  creadaEn        DateTime       @default(now())
  revisadaEn      DateTime?
  @@index([usuarioId])
  @@index([estado])
}
```

- [ ] **Step 2: Campos en `Usuario`** (dentro de `model Usuario`)

```prisma
nivelKyc                Int      @default(0)
baneado                 Boolean  @default(false)
telefono                String?
telefonoVerificado      Boolean  @default(false)
verificaciones          VerificacionKyc[] @relation("verificaciones")
verificacionesRevisadas VerificacionKyc[] @relation("revisor")
```

- [ ] **Step 3: Migrar + regenerar + reiniciar dev**

```bash
npx prisma migrate dev --name kyc
```
Tras migrar: matar y relanzar `next dev` (el cliente Prisma viejo queda en memoria, ver memoria `no build con dev activo`).

- [ ] **Step 4: Verificar + commit + docs Fase 1** (igual ciclo). Versión `v0.0.50`.

---

## Fase 2 — Máquina de estados (Server Actions)

**Files:**
- Create: `lib/kyc/estados.ts` (diccionario de transiciones + validador)
- Create: `lib/kyc/config.ts` (toggles de pasos requeridos)
- Create: `app/(app)/configuracion/kyc-actions.ts` (acciones del usuario)
- Create: `app/admin/kyc-actions.ts` (acciones del revisor)

- [ ] **Step 1: Transiciones** — `lib/kyc/estados.ts`

```ts
import type { EstadoKyc } from "@prisma/client";
export const TRANSICIONES: Record<EstadoKyc, EstadoKyc[]> = {
  pendiente: ["en_revision"],
  en_revision: ["aprobada", "rechazada", "reenvio_solicitado", "baneada"],
  reenvio_solicitado: [],   // el reenvío crea un NUEVO intento, no transiciona este
  aprobada: [],
  rechazada: [],
  baneada: [],
};
export function puedeTransicionar(actual: EstadoKyc, siguiente: EstadoKyc): boolean {
  return TRANSICIONES[actual]?.includes(siguiente) ?? false;
}
```

- [ ] **Step 2: Toggles de pasos** — `lib/kyc/config.ts`

```ts
import { prisma } from "@/lib/db";
export const PASOS_KYC = ["DOCUMENTO", "SELFIE", "VIDEO", "DIRECCION"] as const;
export type PasoKyc = (typeof PASOS_KYC)[number];
const DEFAULTS: Record<PasoKyc, boolean> = { DOCUMENTO: true, SELFIE: true, VIDEO: true, DIRECCION: false };
export async function pasosRequeridos(): Promise<Record<PasoKyc, boolean>> {
  const filas = await prisma.configuracionApp.findMany({ where: { clave: { startsWith: "KYC_REQUIERE_" } } });
  const map = Object.fromEntries(filas.map((f) => [f.clave, f.valor === "true"]));
  return Object.fromEntries(PASOS_KYC.map((p) => [p, map[`KYC_REQUIERE_${p}`] ?? DEFAULTS[p]])) as Record<PasoKyc, boolean>;
}
```

- [ ] **Step 3: Acciones del usuario** — `app/(app)/configuracion/kyc-actions.ts`
  - `enviarVerificacion(prev, formData)`: valida sesión; valida campos según `pasosRequeridos()`; sube archivos (recibe keys ya subidas por URL firmada); crea `VerificacionKyc` en `pendiente`; `notificarYCorreo` ("Recibimos tu verificación"); rechaza si ya hay una `pendiente`/`en_revision`.
  - `pedirUrlSubida(tipo: 'docFrente'|'docReverso'|'selfie'|'video')`: valida sesión, genera key `kyc/{usuarioId}/{intento}/{tipo}.{ext}` y devuelve `urlFirmadaSubida`.

- [ ] **Step 4: Acciones del revisor** — `app/admin/kyc-actions.ts` (todas exigen rol super_admin)
  - `tomarRevision(id)`: `pendiente → en_revision`.
  - `resolverKyc(id, accion, motivo?, nota?)` con `accion ∈ {aprobar, rechazar, reenvio, banear}`:
    valida `puedeTransicionar`; aplica estado; si aprobar → `usuario.nivelKyc = 1`; si banear → `usuario.baneado = true`; guarda `motivoRechazo`/`notaInterna`/`revisadoPorId`/`revisadaEn`; `notificarYCorreo` según acción.
  - `urlsRevision(id)`: devuelve URLs firmadas de lectura de los archivos (solo super_admin).
  - `guardarPasosKyc(toggles)`: upsert de `KYC_REQUIERE_*`.

- [ ] **Step 5: Verificar + commit + docs Fase 2.** Versión `v0.0.51`.

---

## Fase 3 — UI del usuario (asistente de verificación)

**Files:**
- Create: `components/kyc/asistente-kyc.tsx` (wizard pasos, reusa patrón de `sanes/crear`)
- Create: `components/kyc/captura-video.tsx` (`MediaRecorder` liveness)
- Create: `components/kyc/subir-imagen.tsx` (input file + preview + subida por URL firmada)
- Modify: `components/seccion-verificacion.tsx` (el paso 3 KYC abre el asistente / muestra estado)
- Modify: `app/(app)/configuracion/page.tsx` (pasar estado KYC actual del usuario)

- [ ] **Step 1:** `subir-imagen.tsx` — pide `pedirUrlSubida`, sube con `fetch(PUT)`, valida tipo (jpg/png/pdf) y ≤5 MB, muestra preview, expone la key al wizard.
- [ ] **Step 2:** `captura-video.tsx` — `navigator.mediaDevices.getUserMedia({video,audio})`, `MediaRecorder`, instrucciones en pantalla (pestañear → boca 3× → 3 dedos), límite 7-10 s, ≤20 MB, sube por URL firmada.
- [ ] **Step 3:** `asistente-kyc.tsx` — muestra solo pasos activos (`pasosRequeridos`), pasos: documento (tipo + V/E + número + anverso/reverso) → selfie → video → revisar/enviar (`enviarVerificacion`). Indicador deslizante (reusa `use-indicador`).
- [ ] **Step 4:** Estado en `seccion-verificacion.tsx`: si hay solicitud `pendiente`/`en_revision` → banner ámbar "En revisión"; si `reenvio_solicitado` → reabrir con motivo; si `aprobada` → ✓ verde.
- [ ] **Step 5:** Verificar + commit + docs Fase 3. Versión `v0.0.52`.

---

## Fase 4 — Cola de revisión (super-admin)

**Files:**
- Create: `components/kyc/cola-kyc.tsx` (lista pendientes/aprobadas/rechazadas + detalle + acciones + toggles)
- Modify: `app/admin/page.tsx` (nueva pestaña "Verificaciones" en `PanelTabs`; query de solicitudes — última por usuario)

- [ ] **Step 1:** Query "última solicitud por usuario" (Prisma: agrupar por `usuarioId`, tomar `max(creadaEn)`), separadas por estado.
- [ ] **Step 2:** `cola-kyc.tsx` — sub-tabs Pendientes/Aprobadas/Rechazadas (`PanelTabs variante="sub"`); tarjeta con anverso/reverso/selfie/video vía `urlsRevision` (URLs firmadas); botones Tomar / Aprobar / Rechazar (motivo) / Solicitar reenvío (motivo) / Rechazar y banear; campo nota interna; bloque de toggles `guardarPasosKyc`.
- [ ] **Step 3:** Añadir pestaña "Verificaciones" en `app/admin/page.tsx`.
- [ ] **Step 4:** Verificar + commit + docs Fase 4. Versión `v0.0.53`.

---

## Fase 5 — Notificaciones, plantillas e indicadores

**Files:**
- Modify: `lib/correo/catalogo.ts` (eventos KYC: recibida, aprobada, reenvio, rechazada, baneada)
- Modify: `components/seccion-verificacion.tsx` + perfil (tag "Verificado")
- Modify: `app/(app)/perfil/page.tsx`, `app/(app)/dashboard/page.tsx` (tag/indicador por `nivelKyc`)

- [ ] **Step 1:** Añadir eventos KYC al catálogo (app+correo) con plantillas y variables (`{{motivo}}`).
- [ ] **Step 2:** Tag "Verificado" verde junto al apodo cuando `nivelKyc>=1`.
- [ ] **Step 3:** Indicadores verde/ámbar en la sección Verificación.
- [ ] **Step 4:** Verificar + commit + docs Fase 5. Versión `v0.0.54`.

---

## Fase 6 — Despliegue VPS-2 (beta)

Sigue la spec `docs/superpowers/specs/2026-05-31-despliegue-beta-vps2-design.md`. **NO TOCAR** los servicios existentes (n8n, chatwoot, evolution). Green Sol en `/opt/greensol`, contenedor en `127.0.0.1:3100`, nginx host + certbot.

**Files:**
- Create: `Dockerfile` (multi-stage node:22-alpine, `output:"standalone"`)
- Create: `.dockerignore`
- Create: `docker-compose.prod.yml` (web + db + minio, red interna, web en `127.0.0.1:3100:3000`)
- Create: `entrypoint.sh` (`prisma migrate deploy` → `node server.js`)
- Create: `docs/DESPLIEGUE_VPS.md`
- Modify: `next.config.ts` (`output: "standalone"`)

- [ ] **Step 1:** `next.config.ts` standalone (leer `node_modules/next/dist/docs/.../17-deploying.md` antes, por `AGENTS.md`).
- [ ] **Step 2:** Dockerfile + .dockerignore + entrypoint.
- [ ] **Step 3:** `docker-compose.prod.yml` con **web + db (postgres:16) + minio** (bucket privado), volúmenes persistentes, solo `web` publicado en `127.0.0.1:3100`.
- [ ] **Step 4:** En VPS (SSH desde `/home/lu/Paginas web y Landing/acceso a la vps 1 proyecciondigital.txt`, host VPS-2 `n8n.proyecciondigital.org` / `89.117.73.129`): crear `/opt/greensol`, subir `.env` (vars reales, no al repo), `git clone`, `docker compose -f docker-compose.prod.yml up -d --build`.
- [ ] **Step 5: Subir la DB local al VPS** — `pg_dump` local → restaurar en el contenedor `db` del VPS:
```bash
# local
pg_dump "postgresql://greensol:***@localhost:5433/greensol" -Fc -f /tmp/greensol.dump
scp /tmp/greensol.dump <vps>:/opt/greensol/
# vps
docker compose -f docker-compose.prod.yml exec -T db pg_restore -U greensol -d greensol --clean --if-exists < /opt/greensol/greensol.dump
```
- [ ] **Step 6:** nginx server block `greensol.creceideas.com` → `proxy_pass http://127.0.0.1:3100`; `certbot --nginx -d greensol.creceideas.com` (DNS en gris). Verificar HTTPS.
- [ ] **Step 7:** QA E2E Playwright contra `https://greensol.creceideas.com` (smoke: home, login, ver sección verificación).
- [ ] **Step 8:** Commit infra + docs Fase 6. Versión `v0.0.55`. Beta lista para alpha testing.

---

## Self-review (cobertura de la spec)

- Almacenamiento MinIO + URLs firmadas → Fase 0 ✓
- Modelo `VerificacionKyc` + campos Usuario → Fase 1 ✓
- Pasos configurables por toggles → Fase 2 (`lib/kyc/config.ts`) + Fase 4 (UI) ✓
- Máquina de estados + transiciones bloqueadas → Fase 2 ✓
- Flujo usuario (documento V/E, anverso/reverso, selfie, video liveness) → Fase 3 ✓
- Cola super-admin (tomar/aprobar/rechazar/reenvío/banear, nota interna, última por usuario) → Fase 4 ✓
- Notificaciones app+correo + tag Verificado + indicadores → Fase 5 ✓
- Despliegue VPS + subir DB + beta en subdominio → Fase 6 ✓
- Liveness manual (sin ML) → Fase 3 (solo graba; revisa humano en Fase 4) ✓
- Seguridad: bucket privado, URLs firmadas, secretos en env → Fases 0/2/6 ✓
