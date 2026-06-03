# Invitación con solicitud, pestaña Miembros y Pagos simplificada — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Añadir invitaciones temporales con solicitud de unión (privado = solicitud, público = directo), reestructurar el detalle del san a tres pestañas (Resumen · Miembros · Pagos) y simplificar Pagos.

**Architecture:** Dos modelos nuevos (`Invitacion`, `SolicitudUnion`) + server actions en `app/(app)/sanes/actions.ts`. UI reusa `PanelTabs` (extendido con avisos) y el patrón `components/san/*`. Notificaciones por el catálogo existente.

**Tech Stack:** Next.js (esta versión modificada — leer `node_modules/next/dist/docs/` antes de tocar APIs), Prisma + Postgres (Podman, 5433), React Server Components + server actions, Playwright (E2E).

**Verificación (patrón del proyecto):** `tsc --noEmit` limpio por fase; **reiniciar dev server tras migración**; E2E (`npm run test:e2e`, base `greensol_test`) al cierre. Commits 0.0.x por avance.

**Spec:** `docs/superpowers/specs/2026-06-03-invitacion-miembros-pagos-design.md`

---

## Fase 1 — Datos (modelos + migración)

### Task 1: Modelos `Invitacion` y `SolicitudUnion`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1:** Añadir el enum y los modelos:

```prisma
enum EstadoSolicitud {
  pendiente
  aprobada
  rechazada
}

model Invitacion {
  id          String    @id @default(cuid())
  recolectaId String
  recolecta   Recolecta @relation(fields: [recolectaId], references: [id], onDelete: Cascade)
  codigo      String    @unique
  creadaPor   String
  expiraEn    DateTime
  revocada    Boolean   @default(false)
  creadaEn    DateTime  @default(now())
}

model SolicitudUnion {
  id          String          @id @default(cuid())
  recolectaId String
  recolecta   Recolecta       @relation(fields: [recolectaId], references: [id], onDelete: Cascade)
  usuarioId   String
  usuario     Usuario         @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  estado      EstadoSolicitud @default(pendiente)
  creadaEn    DateTime        @default(now())
  resueltaEn  DateTime?

  @@unique([recolectaId, usuarioId])
}
```

- [ ] **Step 2:** Añadir las relaciones inversas en `Recolecta` (`invitaciones Invitacion[]`, `solicitudes SolicitudUnion[]`) y en `Usuario` (`solicitudes SolicitudUnion[]`).

- [ ] **Step 3:** Migración + generate (NO con dev corriendo en build):

```bash
npx prisma migrate dev --name invitacion_solicitud_union
npx prisma generate
```

Expected: migración creada en `prisma/migrations/`, cliente regenerado.

- [ ] **Step 4:** **Reiniciar el dev server** (el cliente Prisma queda viejo si no → PrismaClientValidationError).

- [ ] **Step 5:** `tsc --noEmit` limpio. Commit:

```bash
git add prisma/ && git commit -m "feat(san): modelos Invitacion y SolicitudUnion (v0.0.107)"
```

---

## Fase 2 — Backend: invitaciones y solicitudes

### Task 2: Generador de código corto

**Files:**
- Create: `lib/san/codigo-invitacion.ts`

- [ ] **Step 1:** Función `nuevoCodigo()` que devuelve 6 caracteres del alfabeto `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (sin `0/O/1/I/L`). Sin prefijo en el dato; el prefijo visual "GS-" es solo de presentación. Usar `crypto.randomInt` (no Math.random). Exportar también `LONGITUD = 6` y el alfabeto.

- [ ] **Step 2:** `tsc --noEmit` limpio. Commit:

```bash
git add lib/san/codigo-invitacion.ts && git commit -m "feat(san): generador de código corto de invitación (v0.0.108)"
```

### Task 3: Acciones de invitación

**Files:**
- Modify: `app/(app)/sanes/actions.ts`

- [ ] **Step 1:** `generarInvitacion(recolectaId, diasVigencia)`:
  - verifica sesión + que el usuario sea el organizador y el san esté `abierta`.
  - `diasVigencia` ∈ {1,7,30}, default 7; `expiraEn = now + dias`.
  - genera código único (reintentar si choca con `@unique`), crea `Invitacion`.
  - devuelve `{ codigo, enlace: "/i/" + codigo }`.

- [ ] **Step 2:** `revocarInvitacion(invitacionId)`: solo organizador del san dueño; pone `revocada = true`. `listarInvitacionesActivas(recolectaId)`: devuelve las `!revocada && expiraEn > now`.

- [ ] **Step 3:** Helper `invitacionValida(codigo)`: busca por código, devuelve la invitación si `!revocada && expiraEn > now`, si no `null`.

- [ ] **Step 4:** `tsc --noEmit` limpio. Commit:

```bash
git add "app/(app)/sanes/actions.ts" && git commit -m "feat(san): acciones generar/revocar/listar invitación (v0.0.109)"
```

### Task 4: Solicitud de unión y resolución

**Files:**
- Modify: `app/(app)/sanes/actions.ts`

- [ ] **Step 1:** `solicitarUnion(codigo)`:
  - sesión requerida; resuelve `invitacionValida(codigo)` → si no, `{ error: "Este enlace de invitación ya no es válido." }`.
  - si el usuario ya es `Participante` → redirect al san. Si ya tiene `SolicitudUnion` pendiente → `{ ok: "Ya tienes una solicitud pendiente." }`.
  - si la recolecta es `publico` → crea `Participante` directo (como `unirseARecolecta` hoy) + notifica unión, redirect al san.
  - si es `privado` → `upsert` de `SolicitudUnion` a `pendiente` (reabre si estaba rechazada), notifica al organizador con `san_solicitud_union`. Devuelve `{ ok: "Solicitud enviada. El organizador la revisará." }`.

- [ ] **Step 2:** `resolverSolicitud(solicitudId, aprobar)`:
  - solo el organizador del san dueño.
  - aprobar → `estado = aprobada`, `resueltaEn = now`, crea `Participante` (si no existe), notifica al solicitante `san_solicitud_aceptada`.
  - rechazar → `estado = rechazada`, `resueltaEn = now`, notifica `san_solicitud_rechazada`.
  - `revalidatePath` del detalle del san.

- [ ] **Step 3:** Ajustar `unirseARecolecta`: si la recolecta es `privado`, **no** unir directo — redirigir/derivar a solicitud (o devolver error indicando usar el enlace de invitación). Mantener unión directa solo para `publico` y para el organizador. (La invitación nominal por correo se mantiene como hoy.)

- [ ] **Step 4:** `tsc --noEmit` limpio. Commit:

```bash
git add "app/(app)/sanes/actions.ts" && git commit -m "feat(san): solicitud de unión (privado) + resolver aprobar/rechazar (v0.0.110)"
```

---

## Fase 3 — Notificaciones

### Task 5: Eventos del flujo + formato `@usuario (Nombre Apellido)`

**Files:**
- Modify: `lib/correo/catalogo.ts`, `app/(app)/sanes/actions.ts`

- [ ] **Step 1:** En `catalogo.ts`, añadir (categoría "Ahorros", canales `["app","correo"]`, plantillas de marca con CTA al san):
  - `san_solicitud_union` → variables `solicitante`, `san`, `link`. App: "Nueva solicitud" / "{{solicitante}} solicitó unirse a {{san}}."
  - `san_solicitud_aceptada` → variables `san`, `link`. App: "Te aceptaron 🎉" / "Ya eres parte de {{san}}."
  - `san_solicitud_rechazada` → variables `san`. App: "Solicitud no aprobada" / "Tu solicitud para {{san}} no fue aprobada."

- [ ] **Step 2:** Helper `etiquetaUsuario(u)` → `@usuario (Nombre Apellido)` (usuario primero; cae a "Nombre Apellido"; luego a correo). Úsalo en `san_solicitud_union` (`solicitante`) y en el evento de unión existente (invertir el orden actual "Nombre Apellido (@usuario)").

- [ ] **Step 3:** `tsc --noEmit` limpio. Commit:

```bash
git add lib/correo/catalogo.ts "app/(app)/sanes/actions.ts" && git commit -m "feat(san): avisos de solicitud (unión/aceptada/rechazada) + formato @usuario (Nombre Apellido) (v0.0.111)"
```

---

## Fase 4 — Ruta de invitación

### Task 6: `/i/[codigo]` → solicitar unirse

**Files:**
- Create: `app/i/[codigo]/page.tsx`
- Create: `components/san/solicitar-union.tsx` (client, botón + acción `solicitarUnion`)

- [ ] **Step 1:** Page server component: resuelve `invitacionValida(codigo)`.
  - inválida → mensaje "Este enlace de invitación ya no es válido." + link a `/sanes`.
  - sin sesión → redirect a login con `next` de vuelta al enlace.
  - válida + con sesión → muestra nombre/descripcion/estado del san + `<SolicitarUnion codigo=... nombreSan=... />`.

- [ ] **Step 2:** `solicitar-union.tsx`: botón "Solicitar unirse a {nombreSan}"; al pulsar llama `solicitarUnion(codigo)`; muestra el `ok`/`error` (toast o texto). Si redirige (público/ya miembro), deja que la acción haga el redirect.

- [ ] **Step 3:** `tsc --noEmit` limpio + revisión visual (`/i/<codigo>` con sesión qa). Commit:

```bash
git add "app/i/[codigo]/page.tsx" components/san/solicitar-union.tsx && git commit -m "feat(san): landing de invitación /i/[codigo] → solicitar unirse (v0.0.112)"
```

---

## Fase 5 — Pestañas y aviso

### Task 7: `PanelTabs` con avisos por pestaña

**Files:**
- Modify: `components/panel-tabs.tsx`

- [ ] **Step 1:** Añadir prop opcional `avisos?: boolean[]`. Al renderizar cada botón, si `avisos[i]`, mostrar un puntito (`<span>` ~7px, `bg-brand` o ámbar, `rounded-full`) a la derecha del label. No romper usos actuales (prop opcional, default sin puntos).

- [ ] **Step 2:** `tsc --noEmit` limpio. Commit:

```bash
git add components/panel-tabs.tsx && git commit -m "feat(ui): PanelTabs soporta puntito de aviso por pestaña (v0.0.113)"
```

---

## Fase 6 — Pestaña Miembros

### Task 8: Componente Miembros + integración

**Files:**
- Create: `components/san/miembros.tsx`
- Modify: `app/(app)/sanes/[id]/page.tsx`

- [ ] **Step 1:** `miembros.tsx` recibe `{ recolecta, esOrganizador, solicitudesPendientes, aportes, resolverSolicitud (bound) }`.
  - **Solo organizador, arriba:** sección "Solicitudes pendientes" — por cada `SolicitudUnion` pendiente, `<FilaParticipante>` del solicitante + botones Aprobar/Rechazar (`resolverSolicitud.bind(null, s.id, true/false)`). Estado vacío oculto si no hay.
  - **Participantes:** lista con `<FilaParticipante>` (Nombre Apellido + @usuario, organizador dorado), turno, **estado de pago de la ronda** (pagó/pendiente según aportes confirmados) y **fecha del último pago**.

- [ ] **Step 2:** En `[id]/page.tsx`: consultar `solicitudesPendientes` (`SolicitudUnion` estado pendiente) e incluirlas. Cambiar a `<PanelTabs tabs={["Resumen","Miembros","Pagos"]} avisos={[false, hayPendientes, false]}>` con `<Miembros .../>` como segundo hijo. Pasar acción `resolverSolicitud` bound.

- [ ] **Step 3:** `tsc --noEmit` limpio + revisión visual. Commit:

```bash
git add components/san/miembros.tsx "app/(app)/sanes/[id]/page.tsx" && git commit -m "feat(san): pestaña Miembros con solicitudes pendientes + progreso por participante (v0.0.114)"
```

---

## Fase 7 — Pagos simplificada

### Task 9: Tarjeta de método de pago + reubicación

**Files:**
- Create: `components/san/metodo-pago-tarjeta.tsx`
- Modify: `components/san/resumen-san.tsx`, `components/san/pagos-participante.tsx`, `components/san/pagos-organizador.tsx`

- [ ] **Step 1:** `metodo-pago-tarjeta.tsx`: tarjeta visual con los datos de `DatosPagoRecolecta` (pago móvil: banco + teléfono + cédula + titular; transferencia: + número/tipo de cuenta; wallet: dirección). Botón copiar por campo si es trivial.

- [ ] **Step 2:** Mover el bloque "¿Dónde pagar?" **fuera** de `resumen-san.tsx` y montar `<MetodoPagoTarjeta>` **arriba** de la pestaña Pagos (tanto participante como organizador). El Resumen queda con cabecera + dona + invitar.

- [ ] **Step 3:** `tsc --noEmit` limpio + revisión visual. Commit:

```bash
git add components/san/metodo-pago-tarjeta.tsx components/san/resumen-san.tsx components/san/pagos-participante.tsx components/san/pagos-organizador.tsx && git commit -m "feat(san): Pagos simplificada — método de pago en tarjeta arriba (v0.0.115)"
```

---

## Fase 8 — Invitar (generar/revocar) en Resumen

### Task 10: Componente Invitar

**Files:**
- Create: `components/san/invitar.tsx`
- Modify: `components/san/resumen-san.tsx`

- [ ] **Step 1:** `invitar.tsx` (client) recibe `{ recolectaId, invitaciones, generar (bound), revocar (bound) }`:
  - selector de vigencia (1 / 7 / 30 días, default 7) + botón "Generar invitación" → `generarInvitacion`.
  - muestra el **código** (con prefijo visual "GS-") y el **enlace** `/i/<codigo>` con botón copiar; lista invitaciones activas con su vencimiento y botón **Revocar**.
  - integra/coexiste con `CompartirAhorro` (compartir el enlace generado).

- [ ] **Step 2:** En `resumen-san.tsx`, si el san está `abierta`, renderizar `<Invitar .../>` (consultar `listarInvitacionesActivas` en la page y pasar acciones bound).

- [ ] **Step 3:** `tsc --noEmit` limpio + revisión visual. Commit:

```bash
git add components/san/invitar.tsx components/san/resumen-san.tsx "app/(app)/sanes/[id]/page.tsx" && git commit -m "feat(san): generar/revocar invitación temporal + código corto y enlace (v0.0.116)"
```

---

## Fase 9 — E2E + documentación

### Task 11: E2E del flujo de invitación

**Files:**
- Modify/Create: `e2e/autenticado.spec.ts` o `e2e/san-invitacion.spec.ts`

- [ ] **Step 1:** Test determinista (dos contextos, patrón de `kyc-integral.spec.ts`): organizador crea san privado → genera invitación → segundo usuario abre `/i/<codigo>` → solicita → organizador ve el puntito en Miembros y la solicitud → aprueba → el segundo usuario aparece como participante. NO contra la base de dev (usar `greensol_test`, QA existente).

- [ ] **Step 2:** `npm run test:e2e -- --reporter=line` → verde.

- [ ] **Step 3:** Commit:

```bash
git add e2e/ && git commit -m "test(e2e): flujo de invitación → solicitud → aprobación (v0.0.117)"
```

### Task 12: Documentación + versión

**Files:**
- Modify: `CHANGELOG.md`, `docs/PRD.md`, `docs/PRD.html`, `docs/ARQUITECTURA_TECNICA.md`, `package.json`

- [ ] **Step 1:** CHANGELOG v0.0.107–0.0.117. PRD: sección invitación/solicitud + pestaña Miembros + Pagos simplificada; estado actualizado. ARQUITECTURA: modelos nuevos, acciones, ruta `/i/[codigo]`, eventos de notificación, `PanelTabs.avisos`. Markdown sin hard-wrap. `package.json` a la versión final.

- [ ] **Step 2:** Commit:

```bash
git add CHANGELOG.md docs/ package.json && git commit -m "docs(san): invitación/solicitud + Miembros + Pagos — PRD/arquitectura/CHANGELOG al día (v0.0.118)"
```

---

## Self-review (cobertura del spec)

- Invitación temporal (código corto, vencimiento 1/7/30, revocar) → Tasks 2, 3, 10 ✓
- Enlace `/i/<codigo>` → solicitar → Tasks 4, 6 ✓
- Privado = solicitud / público = directo / nominal = directo → Task 4 ✓
- Resolver aprobar/rechazar + notificaciones → Tasks 4, 5 ✓
- Formato `@usuario (Nombre Apellido)` en notificaciones → Task 5 ✓
- Tres pestañas + puntito de aviso → Tasks 7, 8 ✓
- Miembros: solicitudes pendientes + progreso por participante → Task 8 ✓
- Pagos simplificada (método arriba en tarjeta) → Task 9 ✓
- Migración + reiniciar dev + tsc/E2E + docs → Tasks 1, 11, 12 ✓
- Fuera de alcance (cripto, SMTP, incentivos) → respetado ✓
