# Bloque 0 — Cimientos · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el esqueleto de Green Sol corriendo en local (Next.js + Tailwind + shadcn/ui + Prisma + Postgres en Docker) con identidad de marca, framework de tests y un health-check que confirme la conexión a la base de datos.

**Architecture:** App full-stack en Next.js (App Router, TypeScript). UI con Tailwind + shadcn/ui, modo light por defecto e identidad verde. Datos en Postgres (local vía Docker en dev; en el VPS en producción) con Prisma. Tests con Vitest. Despliegue futuro en Vercel.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL 16 (Docker), Vitest.

> **Alcance:** este plan cubre SOLO el Bloque 0. Los bloques 1–7 (auth, dashboard/tasas, sanes, pagos, reputación, super-admin, cripto) tendrán su propio plan. Referencias: [spec](../specs/2026-05-29-green-sol-mvp-design.md), [PRD](../../PRD.md).

---

## File Structure (qué se crea en este bloque)

- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs` — config del proyecto (create-next-app).
- `app/layout.tsx` — layout raíz: fuente Inter, metadata, `<html lang="es">`.
- `app/page.tsx` — página de bienvenida placeholder con la marca.
- `app/globals.css` — tokens de color de marca (verde, dorado, light/dark).
- `app/api/health/route.ts` — endpoint que verifica la conexión a Postgres.
- `lib/db.ts` — singleton de PrismaClient.
- `lib/utils.ts` — helper `cn` (lo genera shadcn).
- `prisma/schema.prisma` — datasource Postgres + modelo `Usuario` mínimo.
- `docker/docker-compose.dev.yml` — Postgres 16 para desarrollo.
- `components/ui/*` — componentes base de shadcn (button, card).
- `vitest.config.ts`, `tests/health.test.ts`, `tests/smoke.test.ts` — tests.
- `.env.local` (local, gitignored), `.env.example` (plantilla, versionada).
- `README_DEV.md` — cómo correr el proyecto en local.

---

## Task 1: Scaffolding Next.js

**Files:** crea el árbol base del proyecto en la raíz del repo.

- [ ] **Step 1: Verificar Node 20+**

Run: `node -v`
Expected: `v20.x` o superior. Si no, detener y avisar a Luis para instalar Node 20 LTS.

- [ ] **Step 2: Crear la app Next.js en la raíz del repo**

Run (desde `/home/lu/Proyectos/solana-venezuela`, los docs ya existen, así que se crea en un temporal y se mueve, o se usa `.`):

```bash
npx create-next-app@latest greensol-app --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Expected: crea la carpeta `greensol-app/` con el proyecto. (Se usa subcarpeta para no chocar con `docs/`, `_privado/`, `README.md` existentes. Confirmar con Luis si prefiere mover el contenido a la raíz luego.)

- [ ] **Step 3: Verificar que arranca**

Run: `cd greensol-app && npm run dev` (Ctrl+C tras confirmar).
Expected: servidor en `http://localhost:3000`, página por defecto carga sin errores.

- [ ] **Step 4: Commit**

```bash
git add greensol-app
git commit -m "feat(bloque0): scaffolding Next.js + TS + Tailwind"
```

---

## Task 2: Identidad de marca (tokens + fuente)

**Files:**
- Modify: `greensol-app/app/globals.css`
- Modify: `greensol-app/app/layout.tsx`

- [ ] **Step 1: Tokens de color de marca en globals.css**

Añadir las variables de marca (verde `#0E9F6E` light / `#1DCB8E` dark, dorado `#C8881A`/`#F5C84B`) como CSS variables y exponerlas a Tailwind. Light por defecto:

```css
:root {
  --brand: #0E9F6E; --brand-2: #14C98A; --gold: #C8881A;
}
.dark {
  --brand: #1DCB8E; --brand-2: #2BE6A6; --gold: #F5C84B;
}
```

(Registrar `brand`, `brand-2`, `gold` en la config de Tailwind/`@theme` según la versión generada.)

- [ ] **Step 2: Fuente Inter y lang es en layout**

En `app/layout.tsx`: importar `Inter` de `next/font/google`, aplicarla al `<body>`, `<html lang="es">`, y metadata (title "Green Sol", description del PRD).

- [ ] **Step 3: Verificar**

Run: `npm run dev` y confirmar que la página usa Inter y no hay errores de build.

- [ ] **Step 4: Commit**

```bash
git add greensol-app/app
git commit -m "feat(bloque0): identidad de marca (tokens verde/dorado, Inter, light por defecto)"
```

---

## Task 3: shadcn/ui

**Files:** crea `greensol-app/components/ui/*`, `greensol-app/lib/utils.ts`, `components.json`.

- [ ] **Step 1: Inicializar shadcn**

Run: `cd greensol-app && npx shadcn@latest init -d`
Expected: crea `components.json`, `lib/utils.ts` (con `cn`), y configura el tema base.

- [ ] **Step 2: Añadir componentes base**

Run: `npx shadcn@latest add button card`
Expected: crea `components/ui/button.tsx` y `components/ui/card.tsx`.

- [ ] **Step 3: Verificar**

Run: `npm run build`
Expected: build sin errores de tipos.

- [ ] **Step 4: Commit**

```bash
git add greensol-app/components greensol-app/lib greensol-app/components.json
git commit -m "feat(bloque0): shadcn/ui + componentes base (button, card)"
```

---

## Task 4: Postgres en Docker (dev)

**Files:**
- Create: `greensol-app/docker/docker-compose.dev.yml`
- Create: `greensol-app/.env.local` (gitignored), `greensol-app/.env.example`

- [ ] **Step 1: docker-compose de desarrollo**

`docker/docker-compose.dev.yml`:

```yaml
services:
  db:
    image: postgres:16
    container_name: greensol-db-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: greensol
      POSTGRES_PASSWORD: greensol_dev
      POSTGRES_DB: greensol
    ports:
      - "5433:5432"
    volumes:
      - greensol_pgdata:/var/lib/postgresql/data
volumes:
  greensol_pgdata:
```

(Puerto 5433 en host para no chocar con un Postgres local en 5432.)

- [ ] **Step 2: Variables de entorno**

`.env.example` (versionado):
```
DATABASE_URL="postgresql://greensol:greensol_dev@localhost:5433/greensol?schema=public"
```
`.env.local` (gitignored): copiar el mismo valor. Confirmar que `.gitignore` ya ignora `.env*` (Next.js lo hace por defecto; si no, añadirlo).

- [ ] **Step 3: Levantar y verificar**

Run: `docker compose -f docker/docker-compose.dev.yml up -d` y luego `docker exec greensol-db-dev pg_isready -U greensol`
Expected: `accepting connections`.

- [ ] **Step 4: Commit**

```bash
git add greensol-app/docker greensol-app/.env.example
git commit -m "feat(bloque0): Postgres 16 en Docker para desarrollo"
```

---

## Task 5: Prisma + modelo Usuario mínimo

**Files:**
- Create: `greensol-app/prisma/schema.prisma`
- Create: `greensol-app/lib/db.ts`

- [ ] **Step 1: Instalar e inicializar Prisma**

Run: `cd greensol-app && npm i -D prisma && npm i @prisma/client && npx prisma init --datasource-provider postgresql`

- [ ] **Step 2: Modelo Usuario mínimo en schema.prisma**

```prisma
model Usuario {
  id              String   @id @default(cuid())
  correo          String   @unique
  hashContrasena  String?
  correoVerificado Boolean @default(false)
  rol             Rol      @default(usuario)
  creadoEn        DateTime @default(now())
}

enum Rol {
  usuario
  admin_grupo
  super_admin
}
```

- [ ] **Step 3: Singleton de PrismaClient en lib/db.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 4: Migración inicial**

Run: `npx prisma migrate dev --name init`
Expected: crea `prisma/migrations/.../migration.sql`, aplica a la DB y genera el cliente.

- [ ] **Step 5: Commit**

```bash
git add greensol-app/prisma greensol-app/lib/db.ts greensol-app/package.json greensol-app/package-lock.json
git commit -m "feat(bloque0): Prisma + modelo Usuario + migracion inicial"
```

---

## Task 6: Vitest + test de humo

**Files:**
- Create: `greensol-app/vitest.config.ts`
- Create: `greensol-app/tests/smoke.test.ts`
- Modify: `greensol-app/package.json` (script `test`)

- [ ] **Step 1: Instalar Vitest**

Run: `cd greensol-app && npm i -D vitest`

- [ ] **Step 2: Config y script**

`vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```
En `package.json` añadir: `"test": "vitest run"`.

- [ ] **Step 3: Escribir el test de humo (falla primero)**

`tests/smoke.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("combina clases y resuelve conflictos de tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
```

- [ ] **Step 4: Correr el test**

Run: `npm test`
Expected: PASS (el helper `cn` ya existe desde shadcn). Si falla por el alias `@`, configurar `resolve.alias` en `vitest.config.ts` apuntando `@` a la raíz del proyecto.

- [ ] **Step 5: Commit**

```bash
git add greensol-app/vitest.config.ts greensol-app/tests greensol-app/package.json
git commit -m "test(bloque0): Vitest + test de humo"
```

---

## Task 7: Health-check de la base de datos

**Files:**
- Create: `greensol-app/app/api/health/route.ts`
- Create: `greensol-app/tests/health.test.ts`

- [ ] **Step 1: Escribir el test del health-check (falla primero)**

`tests/health.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("responde ok:true y db:true cuando la base de datos está accesible", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.db).toBe(true);
  });
});
```

- [ ] **Step 2: Correr el test para verlo fallar**

Run: `npm test -- tests/health.test.ts`
Expected: FAIL (módulo `@/app/api/health/route` no existe).

- [ ] **Step 3: Implementar el endpoint**

`app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json({ ok: true, db: false }, { status: 503 });
  }
}
```

- [ ] **Step 4: Correr el test (con la DB de Docker levantada)**

Run: `npm test -- tests/health.test.ts`
Expected: PASS. Verificar también en navegador: `npm run dev` → `http://localhost:3000/api/health` devuelve `{"ok":true,"db":true}`.

- [ ] **Step 5: Commit**

```bash
git add greensol-app/app/api/health greensol-app/tests/health.test.ts
git commit -m "feat(bloque0): health-check de la base de datos + test"
```

---

## Task 8: Bienvenida con marca + seguridad base + README dev

**Files:**
- Modify: `greensol-app/app/page.tsx`
- Modify: `greensol-app/next.config.ts`
- Create: `greensol-app/README_DEV.md`

- [ ] **Step 1: Página de bienvenida placeholder con la marca**

En `app/page.tsx`: una pantalla simple centrada con el nombre "Green Sol", el tagline ("Tu ahorro en grupo, al mundo cripto") y un `Button` de shadcn ("Entrar") — usando los colores de marca. Sin lógica todavía.

- [ ] **Step 2: Security headers en next.config.ts**

Añadir `headers()` con cabeceras base: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

- [ ] **Step 3: README de desarrollo**

`README_DEV.md` con: requisitos (Node 20, Docker), pasos para correr (`docker compose -f docker/docker-compose.dev.yml up -d`, `npm install`, `npx prisma migrate dev`, `npm run dev`), y cómo correr tests (`npm test`).

- [ ] **Step 4: Verificar build y tests**

Run: `npm run build && npm test`
Expected: build OK, todos los tests PASS.

- [ ] **Step 5: Commit**

```bash
git add greensol-app/app/page.tsx greensol-app/next.config.ts greensol-app/README_DEV.md
git commit -m "feat(bloque0): bienvenida con marca + security headers + README dev"
```

---

## Decisiones diferidas (no bloquean el bloque 0)
- **Mover el proyecto a la raíz del repo** vs mantener `greensol-app/`: confirmar con Luis.
- **Deploy en Vercel + DB en VPS:** se configura al cerrar el bloque (necesita el acceso al VPS y conectar Vercel). El Dockerfile de producción para el VPS se añade cuando se prepare ese despliegue.
- **Gestor de paquetes:** se asume npm; si Luis prefiere pnpm, ajustar los comandos.

---

## Self-Review

**Spec coverage (Bloque 0 del §6 del spec):** scaffolding Next.js ✓ (T1), Tailwind+shadcn+marca ✓ (T2,T3), docker-compose Postgres ✓ (T4), Prisma+conexión ✓ (T5), framework de tests ✓ (T6), esqueleto de seguridad ✓ (T8 headers + env), deploy Vercel → diferido (necesita VPS/cuenta, documentado). Cubierto.

**Placeholders:** los pasos con código lo muestran completo (db.ts, schema, health route, tests, compose). Los pasos de config (globals.css tokens, page.tsx) describen contenido concreto; el detalle visual fino del `page.tsx` es intencionalmente simple (placeholder) y no bloquea.

**Type consistency:** `prisma` exportado en `lib/db.ts` y usado en `health/route.ts`; `cn` de `lib/utils.ts` (shadcn) usado en `smoke.test.ts`; modelo `Usuario`/enum `Rol` coherentes con el spec §3. OK.
