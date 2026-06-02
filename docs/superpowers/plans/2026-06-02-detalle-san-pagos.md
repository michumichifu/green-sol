# Detalle del san: pestañas, pagos con conversión y avisos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o executing-plans. Steps usan checkbox (`- [ ]`).

**Goal:** Reestructurar el detalle del san en pestañas (Resumen / Pagos), con vista de pagos por rol (organizador revisa; participante ve cuánto paga en Bs↔$ y reporta), participantes compactos, dona de progreso, y aviso al organizador cuando alguien se une.

**Architecture:** Rediseño de UI/UX sobre el backend existente (`Aporte`, `reportarPago`, `resolverAporte`, `Turno`, `DatosPagoRecolecta`, tasas en `lib/rates/cache.ts`). Se parte el archivo grande `app/(app)/sanes/[id]/page.tsx` en componentes en `components/san/`. Lógica de montos/conversión en `lib/san/montos.ts`. Avisos vía el catálogo de notificaciones existente. Sin cambios de esquema.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Tailwind v4, Prisma, lucide. Verificar con `timeout 150 npx tsc --noEmit | grep "error TS"`, E2E aislado `npm run test:e2e` (base greensol_test/3100, NO toca dev), y revisión visual con captura (sesión qa vía `/api/test/sesion`, sin crear usuarios). Hay `next dev` en :3000 (NO reiniciar).

Spec: `docs/superpowers/specs/2026-06-02-detalle-san-pagos-design.md`.

---

## File Structure
- `lib/san/montos.ts` (nuevo) — `aportePersona`, `montoEnBs`, `infoMontoParticipante`.
- `components/san/dona-progreso.tsx` (nuevo) — dona SVG.
- `components/san/fila-participante.tsx` (nuevo) — fila compacta.
- `components/san/resumen-san.tsx` (nuevo) — contenido pestaña Resumen.
- `components/san/pagos-participante.tsx` (nuevo) — "lo que te toca pagar" + reportar + historial.
- `components/san/pagos-organizador.tsx` (nuevo) — sub-pestañas pendientes/aprobados.
- `app/(app)/sanes/[id]/page.tsx` (modificar) — arma las pestañas con los componentes.
- `app/(app)/sanes/actions.ts` (modificar) — aviso al unirse; avisos de pago donde falten.
- `lib/correo/catalogo.ts` (modificar) — evento `san_nuevo_participante` (+ los de pago que falten).

Cada tarea: `tsc` limpio → (E2E/visual donde aplique) → commit `v0.0.x` + CHANGELOG.

---

## Task 1 — Lógica de montos y conversión (`lib/san/montos.ts`)

**Files:** Create `lib/san/montos.ts`

- [ ] **Step 1:** Implementar (lee antes `lib/validations/recolecta.ts` para `MONEDA_RECOLECTA[moneda].ancla`/`enBolivares`, y `lib/rates/cache.ts` para el tipo `Tasas`):
```ts
import type { Tasas } from "@/lib/rates/cache";
import { MONEDA_RECOLECTA } from "@/lib/validations/recolecta";

/** Aporte por persona en la moneda-ancla del san (san: meta por turno / cupo; vaca: meta / cupo). */
export function aportePersona(montoAporte: number, cupo: number | null): number {
  if (!cupo || cupo <= 0) return montoAporte;
  return montoAporte / cupo;
}

export type InfoMonto = {
  enBolivares: boolean;        // true si el san se paga en Bs (bs_bcv/bs_usdt)
  ancla: string;               // "$" | "USDC" | "SOL"
  montoAncla: number;          // monto por persona en la moneda-ancla
  tasa: number | null;         // Bs por unidad-ancla (solo si enBolivares)
  fuenteTasa: string | null;   // "dólar BCV" | "USDC/promedio" | null
  montoBs: number | null;      // montoAncla * tasa (solo si enBolivares y hay tasa)
};

/** Calcula lo que paga un participante: en la ancla y, si aplica, en Bs a la tasa del día. */
export function infoMontoParticipante(
  moneda: string,
  montoAnclaPersona: number,
  tasas: Tasas,
): InfoMonto {
  const def = MONEDA_RECOLECTA[moneda];
  const ancla = def?.ancla ?? "$";
  const enBolivares = def?.enBolivares ?? false;
  let tasa: number | null = null;
  let fuenteTasa: string | null = null;
  if (enBolivares) {
    if (moneda === "bs_bcv") { tasa = tasas.bcv?.usd ?? null; fuenteTasa = "dólar BCV"; }
    else if (moneda === "bs_usdt") { tasa = tasas.usdt?.promedio ?? null; fuenteTasa = "USDC/promedio"; }
  }
  return {
    enBolivares, ancla, montoAncla: montoAnclaPersona, tasa, fuenteTasa,
    montoBs: enBolivares && tasa ? montoAnclaPersona * tasa : null,
  };
}
```

- [ ] **Step 2:** Verificar con tsx:
`npx tsx -e "import {infoMontoParticipante} from './lib/san/montos'; console.log(JSON.stringify(infoMontoParticipante('bs_bcv', 20, {bcv:{usd:200,eur:0,fecha:'',variacionUsd:null},usdt:null,sol:null,actualizado:null})))"`
Expected: incluye `"montoBs":4000`, `"ancla":"$"`, `"fuenteTasa":"dólar BCV"`.

- [ ] **Step 3:** `tsc` limpio + commit:
```bash
git add lib/san/montos.ts && git commit -m "feat(san): lógica de aporte por persona y conversión Bs↔ancla (v0.0.99)"
```

---

## Task 2 — Aviso al organizador cuando alguien se une (fix del bug)

**Files:** Modify `lib/correo/catalogo.ts`, `app/(app)/sanes/actions.ts` (`unirseARecolecta`)

- [ ] **Step 1:** En `lib/correo/catalogo.ts` añade un evento `san_nuevo_participante` (categoría "Ahorros" o la que exista), canales `["app","correo"]`, variables `{ participante: "Nombre Apellido (@usuario)", san: "Nombre del san", link: "URL" }`. App: título "Nuevo participante en tu san 👋", cuerpo "{{participante}} se unió a {{san}}." Correo: asunto "Nuevo participante en {{san}}" + HTML de marca con el mismo texto y CTA al san. (Sigue el formato de los eventos existentes en ese archivo.)

- [ ] **Step 2:** En `unirseARecolecta` (`app/(app)/sanes/actions.ts:171`), después de crear el `Participante` y ANTES del redirect/return de éxito, notifica al ORGANIZADOR. Lee primero la función para el patrón exacto. Usa `notificarYCorreo` (que ya se importa) con el `organizadorId` de la recolecta y los datos del nuevo participante:
```ts
// nuevoUsuario = el usuario que se acaba de unir (ya lo tienes en la acción)
const etiqueta = `${nuevoUsuario.nombre ?? ""} ${nuevoUsuario.apellido ?? ""}`.trim() +
  (nuevoUsuario.nombreUsuario ? ` (@${nuevoUsuario.nombreUsuario})` : "");
await notificarYCorreo(
  { id: recolecta.organizadorId, correo: organizadorCorreo },  // trae el correo del organizador (incluye organizador en el findUnique/findFirst, o consúltalo)
  { evento: "san_nuevo_participante", datos: { participante: etiqueta, san: recolecta.nombre, link: `/sanes/${recolecta.id}` } },
);
```
Ajusta a la firma real de `notificarYCorreo`/`notificarEvento` (mira `lib/notificaciones.ts` y cómo `crearRecolecta`/`generarTurnos` ya las usan). Asegúrate de traer el correo del organizador (incluir `organizador: { select: { id, correo } }` en la consulta de la recolecta si no está). No notificar si el que se une ES el organizador (no aplica, pero defensivo).

- [ ] **Step 3:** `tsc` limpio. Verifica el flujo con el E2E o manualmente. Commit:
```bash
git add lib/correo/catalogo.ts "app/(app)/sanes/actions.ts" && git commit -m "fix(san): avisar al organizador (app+correo) cuando alguien se une (v0.0.100)"
```

---

## Task 3 — Fila de participante compacta (`components/san/fila-participante.tsx`)

**Files:** Create `components/san/fila-participante.tsx`

- [ ] **Step 1:** Componente que recibe `{ usuario: { nombre, apellido, nombreUsuario, fotoUrl }, esOrganizador, turnoPosicion?, cobrado? }` y renderiza UNA fila densa:
  - Izquierda: si `fotoUrl`, un `<img>` redondo pequeño (~28px); si no, un **ícono** (`User` de lucide) en **dorado** (`text-gold`) cuando `esOrganizador`, o `text-muted-foreground` si no — **sin círculo de fondo**.
  - Centro (una línea, `truncate`, `min-w-0`): **`Nombre Apellido`** en `font-medium` + **`@usuario`** en `text-muted-foreground text-xs`. Si es organizador, una etiqueta pequeña dorada "Organizador".
  - Derecha (`shrink-0`): `turno N` (si hay) y un check verde si `cobrado`/pagó.
  - Fila compacta: `flex items-center gap-2.5 py-1.5` (NADA de tarjetas grandes). Mobile-first.

- [ ] **Step 2:** `tsc` limpio + commit:
```bash
git add components/san/fila-participante.tsx && git commit -m "feat(san): fila de participante compacta (foto/ícono dorado, una línea) (v0.0.101)"
```

---

## Task 4 — Dona de progreso (`components/san/dona-progreso.tsx`)

**Files:** Create `components/san/dona-progreso.tsx`

- [ ] **Step 1:** Componente SVG puro (sin librería) que recibe `{ pagados: number, total: number, label?: string }` y dibuja una **dona**: arco verde (`#14c98a`) proporcional a `pagados/total` sobre un anillo gris (`#eef1ef`), con el número central `pagados/total` y un `label` debajo (ej. "esta ronda"). Tamaño ~96px, `stroke-linecap round`. Maneja `total===0` (dona vacía). Mobile-first.

- [ ] **Step 2:** `tsc` limpio + commit:
```bash
git add components/san/dona-progreso.tsx && git commit -m "feat(san): dona de progreso SVG (v0.0.102)"
```

---

## Task 5 — Pestaña Resumen (`components/san/resumen-san.tsx`) + reestructurar la página en pestañas

**Files:** Create `components/san/resumen-san.tsx`; Modify `app/(app)/sanes/[id]/page.tsx`

- [ ] **Step 1:** LEE `app/(app)/sanes/[id]/page.tsx` completo. Crea `resumen-san.tsx` que reciba la recolecta (con participantes+turnos, datosPago) + `esOrganizador` y arme: cabecera (nombre, estado, chip de rol), **progreso** (barra "Ronda X de Y" actual + `<DonaProgreso>` con pagados/total de la ronda — calcula pagados = aportes confirmados de la ronda; si no es trivial determinar "ronda", usa pagados=turnos cobrados, total=cupo, y déjalo claro), **lista de participantes** usando `<FilaParticipante>` (ambos roles la ven), **¿dónde pagar?** (reusa el bloque actual) e **invitar** (`CompartirAhorro`, solo si abierta).

- [ ] **Step 2:** Reestructura `[id]/page.tsx`: envuelve el contenido en `<PanelTabs tabs={["Resumen", "Pagos"]}>`. Primer hijo = `<ResumenSan .../>`. Segundo hijo = el componente de Pagos según rol (Tasks 6/7): `esOrganizador ? <PagosOrganizador .../> : <PagosParticipante .../>`. Mantén los `bind` de las acciones. Pasa las `tasas` (de `obtenerTasas()`) a los componentes de pago. Quita del render viejo lo que ya migraste (el form de reportar y la lista de aportes se mueven a las Tasks 6/7). La página debe quedar más delgada (coordina; los componentes hacen el trabajo).

- [ ] **Step 3:** `tsc` limpio + revisión visual (captura de `/sanes/<id>` con sesión qa; verifica que el Resumen se ve compacto y las pestañas funcionan). Commit:
```bash
git add components/san/resumen-san.tsx "app/(app)/sanes/[id]/page.tsx" && git commit -m "feat(san): detalle en pestañas + Resumen compacto con dona y participantes (v0.0.103)"
```

---

## Task 6 — Pestaña Pagos: vista participante (`components/san/pagos-participante.tsx`)

**Files:** Create `components/san/pagos-participante.tsx`

- [ ] **Step 1:** Componente que recibe la recolecta, las `tasas`, los aportes propios del participante, y la acción `reportarPago` (bound). Usa `infoMontoParticipante(moneda, aportePersona(montoAporte, cupo), tasas)` (Task 1) para mostrar:
  - **"Lo que te toca pagar":** si `enBolivares`, un bloque destacado con **Bs {montoBs}** grande + "≈ ${montoAncla} · {fuenteTasa}: Bs {tasa}/$" debajo. Si es cripto (usdc/sol), muestra "{montoAncla} {ancla}" + "se paga por tu wallet (Solana)". Si `enBolivares && !tasa`, muestra "${montoAncla}" + nota "tasa no disponible hoy".
  - **Reportar pago:** `<form action={reportar}>` con campo **monto en Bs** (`name="monto"`, prellena con `montoBs` si existe) y a la derecha en vivo la conversión a $ (montoBs/tasa); campo **referencia** (`name="referencia"`); botón "Reportar pago". (Reusa el form actual de `[id]/page.tsx:178` como base.) Para cripto, el monto es en la cripto.
  - **Mi historial:** lista de los aportes propios con estado (reportado/aprobado/rechazado) usando colores (ámbar/verde/rojo) y la referencia.

- [ ] **Step 2:** `tsc` limpio + revisión visual. Commit:
```bash
git add components/san/pagos-participante.tsx && git commit -m "feat(san): pagos del participante — cuánto pagar (Bs↔$) + reportar + historial (v0.0.104)"
```

---

## Task 7 — Pestaña Pagos: vista organizador (`components/san/pagos-organizador.tsx`) + avisos de pago

**Files:** Create `components/san/pagos-organizador.tsx`; Modify `app/(app)/sanes/actions.ts` (avisos en `reportarPago`/`resolverAporte` si faltan)

- [ ] **Step 1:** Componente con `<PanelTabs variante="sub" tabs={["Pendientes", "Aprobados"]}>`:
  - **Pendientes:** los aportes en estado `reportado`. Cada uno: `<FilaParticipante>` del que pagó + monto (Bs + "≈ $" con `infoMontoParticipante`) + referencia + fecha + botones **Aprobar**/**Rechazar** (acciones `resolverAporte.bind(null, a.id, true/false)`, como hoy en `[id]/page.tsx:202-203`). Si no hay, estado vacío ("No hay pagos por revisar").
  - **Aprobados:** aportes `confirmado` (historial, solo lectura) con participante, monto y fecha.
  - Arriba, un mini-resumen: "{pagados} de {total} pagaron esta ronda" + opcional la dona.

- [ ] **Step 2:** En `app/(app)/sanes/actions.ts`, revisa si `reportarPago` ya notifica al organizador y `resolverAporte` al participante. Si falta, añade los avisos (reusa `notificarYCorreo`/`notificarEvento` y eventos del catálogo; si no existen, créalos en `catalogo.ts`: `san_pago_reportado` → organizador, `san_pago_aprobado`/`san_pago_rechazado` → participante). NO dupliques si ya existen.

- [ ] **Step 3:** `tsc` limpio + revisión visual. Commit:
```bash
git add components/san/pagos-organizador.tsx "app/(app)/sanes/actions.ts" "lib/correo/catalogo.ts" && git commit -m "feat(san): pagos del organizador — pendientes/aprobados + avisos (v0.0.105)"
```

---

## Task 8 — E2E + documentación

**Files:** Modify `e2e/autenticado.spec.ts` (o nuevo `e2e/san-pagos.spec.ts`); `docs/PRD.md`, `docs/PRD.html`, `docs/ARQUITECTURA_TECNICA.md`, `CHANGELOG.md`

- [ ] **Step 1:** E2E: extiende `e2e/autenticado.spec.ts` (o crea `e2e/san-pagos.spec.ts`) para: tras crear el san, abrir el detalle, verificar las **pestañas** (Resumen/Pagos), y como organizador ver la sub-pestaña **Pendientes**. (Un segundo usuario que se une y reporta un pago es ideal pero opcional; si lo añades, usa dos contextos como `kyc-integral.spec.ts`. Mantenlo determinista.) Corre `npm run test:e2e -- --reporter=line` → verde. NO toca la base de dev.

- [ ] **Step 2:** Documenta en `PRD.md`/`PRD.html` (§ del san: detalle con pestañas Resumen/Pagos, pagos con conversión Bs↔$ y tasa/ancla, vistas por rol, aviso de unión), `ARQUITECTURA_TECNICA.md` (`lib/san/montos.ts`, `components/san/*`, eventos de notificación nuevos), y `CHANGELOG.md` (v0.0.99–0.0.105). Markdown sin hard-wrap. Sube `package.json` a la versión final.

- [ ] **Step 3:** Commit:
```bash
git add e2e/ docs/ CHANGELOG.md package.json && git commit -m "test+docs(san): E2E del detalle + PRD/arquitectura/CHANGELOG al día (v0.0.106)"
```

---

## Self-review (cobertura del spec)
- Pestañas Resumen/Pagos (ambos roles) → Tasks 5, 6, 7 ✓
- Resumen: cabecera, progreso+dona, participantes compactos, dónde pagar, invitar → Tasks 3, 4, 5 ✓
- Pagos organizador (pendientes/aprobados, aprobar/rechazar) → Task 7 ✓
- Pagos participante (cuánto pagar Bs↔$ + tasa/ancla, reportar, historial) → Tasks 1, 6 ✓
- Conversión Bs↔$ + progreso por conteo → Tasks 1, 5 ✓
- Aviso al unirse (nombre apellido @usuario, app+correo) → Task 2 ✓
- Avisos de pago → Task 7 ✓
- Sin cambios de esquema → respetado (Tasks usan modelos existentes) ✓
- Fuera de alcance (incentivos, captura obligatoria, cripto real, schema) → no se tocan ✓
