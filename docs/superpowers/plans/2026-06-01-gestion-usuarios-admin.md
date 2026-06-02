# Gestión de usuarios (panel super-admin) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans o subagent-driven-development. Steps usan checkbox (`- [ ]`).

**Goal:** Convertir la pestaña Usuarios del panel super-admin en un módulo real (buscar, paginar, ficha en pop-up, gestionar con íconos), simplificar los roles a `usuario`/`super_admin`, y aislar los tests E2E para que no inunden la DB.

**Architecture:** Server components que leen `searchParams` (búsqueda/página/filtro) + server actions con guard `super_admin`. Capa de consultas en `lib/admin/usuarios.ts`. UI en `components/admin/`. Aislamiento E2E con global setup/teardown de Playwright que borra `@test.local`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Prisma+Postgres, Tailwind v4, lucide-react, Playwright. Verificar con `timeout 150 npx tsc --noEmit | grep "error TS"` y `npx playwright test`. Hay un `next dev` en localhost:3000 (cliente Prisma actualizado); NO reiniciarlo. NO usar `next build` con dev activo.

Spec: `docs/superpowers/specs/2026-06-01-gestion-usuarios-admin.md`. Super-admin de QA existente: `qa@greensol.local` (NO crear nuevos).

Cada tarea termina con: `tsc` limpio → (E2E donde aplique) → commit `v0.0.x` + CHANGELOG.

---

## Task 1 — Roles: quitar `admin_grupo` del enum

**Files:**
- Modify: `prisma/schema.prisma` (enum `Rol`)
- Migration: `prisma/migrations/<ts>_roles_sin_admin_grupo/`
- Modify: `app/admin/page.tsx:26` y `app/admin/actions.ts:22` (constantes `ROLES`)

- [ ] **Step 1:** En `schema.prisma`, dejar el enum así:
```prisma
enum Rol {
  usuario
  super_admin
}
```
- [ ] **Step 2:** Crear la migración con SQL crudo (no usar `migrate dev` autogenerado para el enum; editar el `.sql`). Contenido:
```sql
UPDATE "Usuario" SET "rol" = 'usuario' WHERE "rol" = 'admin_grupo';
ALTER TYPE "Rol" RENAME TO "Rol_old";
CREATE TYPE "Rol" AS ENUM ('usuario', 'super_admin');
ALTER TABLE "Usuario" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "Usuario" ALTER COLUMN "rol" TYPE "Rol" USING ("rol"::text::"Rol");
ALTER TABLE "Usuario" ALTER COLUMN "rol" SET DEFAULT 'usuario';
DROP TYPE "Rol_old";
```
Crear el directorio de migración manualmente con un nombre `YYYYMMDDHHMMSS_roles_sin_admin_grupo/migration.sql`, aplicarlo con `npx prisma migrate dev` (que detectará y aplicará), y regenerar el cliente. Si `migrate dev` quiere autogenerar algo distinto, usar `npx prisma migrate dev --create-only` para crear el esqueleto, reemplazar el SQL por el de arriba, y luego `npx prisma migrate dev` para aplicar.
- [ ] **Step 3:** Actualizar las constantes `ROLES` a `["usuario", "super_admin"]` en `app/admin/page.tsx` y `app/admin/actions.ts`. Verificar que no quede ninguna referencia a `admin_grupo` (`grep -rn admin_grupo app components lib`).
- [ ] **Step 4:** `tsc` limpio + commit:
```bash
git add prisma/ app/admin/ && git commit -m "refactor(roles): quitar admin_grupo; roles = usuario/super_admin (v0.0.80)"
```

---

## Task 2 — Consultas: `lib/admin/usuarios.ts`

**Files:**
- Create: `lib/admin/usuarios.ts`

- [ ] **Step 1:** Implementar `buscarUsuarios({ q, pagina, filtro, porPagina })` — búsqueda paginada:
  - `q` (string opcional): si hay texto, filtra usuarios cuyo `correo`, `nombreUsuario`, `telefono` (en `Usuario`) **o** `numeroDocumento` de alguna `VerificacionKyc` contengan `q` (case-insensitive, `contains`, `mode: "insensitive"`). Usar `OR` con un `verificaciones: { some: { numeroDocumento: { contains: q, mode: "insensitive" } } }`.
  - `filtro`: `"todos" | "verificados" | "sin_verificar" | "suspendidos"` → mapea a where (`nivelKyc >= 1`, `nivelKyc < 1`, `baneado: true`).
  - Devuelve `{ usuarios, total, paginas }` con `skip/take` (porPagina por defecto 20), `orderBy: { creadoEn: "desc" }`, `select` de los campos para la fila (id, correo, nombreUsuario, nombre, apellido, fotoUrl, rol, nivelKyc, baneado, creadoEn).
- [ ] **Step 2:** Implementar `fichaUsuario(id)` — trae el usuario con todo lo necesario para la ficha: campos de seguridad (pinHash→booleano, hashContrasena→booleano, otpCorreoActivo, pinBloqueadoHasta), `metodosPago`, y la última `VerificacionKyc` (`orderBy creadaEn desc, take 1`) con sus campos y keys de imágenes. Devolver `pinHash`/`hashContrasena` como booleanos (`tienePin`, `tieneContrasena`) — NUNCA exponer los hashes.
- [ ] **Step 3:** `tsc` limpio + commit:
```bash
git add lib/admin/usuarios.ts && git commit -m "feat(admin): consultas de búsqueda paginada y ficha de usuario (v0.0.81)"
```

---

## Task 3 — Server actions de gestión + enforcement de `baneado` en login

**Files:**
- Create: `app/admin/usuarios-actions.ts`
- Modify: `app/(auth)/actions.ts` (`iniciarSesion`: bloquear `baneado`)
- Modify: `app/admin/actions.ts` (`cambiarRol`: salvaguardas)

- [ ] **Step 1:** En `usuarios-actions.ts` (todas con `"use server"` y guard `super_admin` reusando el patrón de `app/admin/actions.ts`/`esSuperAdmin`):
  - `suspenderUsuario(usuarioId, suspender: boolean)` — set `baneado: suspender`. Salvaguarda: no permitir suspenderse a sí mismo (`usuarioId === sesion.usuarioId` → error).
  - `restablecerVerificacion(usuarioId)` — `nivelKyc = 0`; marca la última `VerificacionKyc` (si existe) con `estado` que permita reenviar según `lib/kyc/estados.ts` (usar `reenvio_solicitado` si la transición lo permite; si no, el estado adecuado). Esto hace reaparecer el banner.
  - `eliminarUsuario(usuarioId)` — guard: no auto-eliminarse; no eliminar al **último** super_admin (contar `super_admin`; si el objetivo es super_admin y es el único, error). Borra dependientes sin cascade primero (Valoracion donde de/aUsuarioId, Participante por usuarioId, Recolecta por organizadorId) y luego `usuario.delete` (cascade cubre Sesion/OTP/Notificacion/MetodoPago/VerificacionKyc). Reusar la lógica probada del script de limpieza.
  - Todas `revalidatePath("/admin")` al terminar.
- [ ] **Step 2:** `cambiarRol` (en `actions.ts`): salvaguardas — no degradar el propio rol; no dejar el sistema sin ningún super_admin (si se degrada al único super_admin → error). Validar contra los 2 roles.
- [ ] **Step 3:** En `iniciarSesion` (`app/(auth)/actions.ts`): tras verificar el PIN correctamente, si `usuario.baneado` → no crear sesión, devolver `{ error: "Tu cuenta está suspendida. Contacta a soporte." }`. (Antes de incrementar ingresos/crear sesión.)
- [ ] **Step 4:** `tsc` limpio + E2E (no deben romperse) + commit:
```bash
git add "app/admin/" "app/(auth)/actions.ts" && git commit -m "feat(admin): suspender/restablecer/eliminar usuarios + bloquear login de suspendidos (v0.0.82)"
```

---

## Task 4 — UI: tabla de usuarios (buscador + filtros + acciones por íconos)

**Files:**
- Create: `components/admin/tabla-usuarios.tsx`

- [ ] **Step 1:** Componente que recibe `{ usuarios, total, paginas, pagina, q, filtro }` (datos del server) y renderiza:
  - **Buscador**: input de texto que actualiza el searchParam `q` (navegación con `router.push`/`Link` preservando filtro; debounce simple o submit con Enter). Un botón/ícono `Search`.
  - **Chips de filtro**: Todos · Verificados · Sin verificar · Suspendidos (cambian el searchParam `filtro`, resetean a página 1).
  - **Lista** de usuarios: cada fila con foto/inicial, nombre/usuario, correo, insignia de estado (Verificado/Sin verificar/Suspendido) y rol.
  - **Acciones por íconos** (lucide: `Eye`, `RotateCcw`, `Ban`/`CircleCheck`, `Trash2`) con `aria-label` y `title`. "Ver ficha" abre el modal `FichaUsuario` (Task 5). Las destructivas (suspender, restablecer, eliminar) muestran un **diálogo de confirmación** antes de invocar la server action (reusar el patrón de modal de confirmación de la cola KYC).
  - **Paginación**: anterior/siguiente + indicador "Página X de N", vía searchParam `pagina`.
  - Cambiar el rol: un control pequeño (select de 2 opciones) que llama `cambiarRol`, con confirmación.
- [ ] **Step 2:** Usar `useTransition` para las acciones, toasts (sonner) para feedback, y deshabilitar botones mientras está pendiente. Mobile-first (la fila colapsa bien en móvil; las acciones caben).
- [ ] **Step 3:** `tsc` limpio + commit:
```bash
git add components/admin/tabla-usuarios.tsx && git commit -m "feat(admin): tabla de usuarios con buscador, filtros y acciones por íconos (v0.0.83)"
```

---

## Task 5 — UI: ficha del usuario (modal)

**Files:**
- Create: `components/admin/ficha-usuario.tsx`

- [ ] **Step 1:** Modal (reusar el patrón de modal del proyecto: `role="dialog"`, `aria-modal`, cierre con Escape y backdrop, como en `registro/completado` o `asistente-kyc`). Recibe la ficha (de `fichaUsuario`, Task 2) — cargada al abrir (server action o pasada desde la fila). Muestra las secciones del spec:
  - **Identidad**: foto (`fotoUrl`) o inicial, nombre, apellido, usuario, correo, teléfono (+ verificado), país, rol, registro, ingresos.
  - **Seguridad**: PIN (sí/no), contraseña (sí/no), OTP correo (activo/no), y si el PIN está bloqueado (`pinBloqueadoHasta` futuro).
  - **KYC**: estado (con la etiqueta de `cola-kyc`), tipo+número de documento, nacionalidad, dirección/ciudad/región, y las **imágenes** (frente, reverso, selfie, video) vía las rutas `/api/almacen/<key>` (construir la URL del proxy con las keys; reusar cómo lo hace `urlsRevision`/`ColaKyc`). Fecha de revisión + revisor.
  - **Métodos de pago**: lista con categoría/moneda/método/alias/titular/banco/cuenta.
  - **Acciones**: restablecer verificación, suspender/reactivar, cambiar rol, eliminar — con confirmación, reusando las server actions.
- [ ] **Step 2:** Si las imágenes del KYC requieren URLs firmadas en vez del proxy directo, reusar el mecanismo existente de `kyc-actions.ts` (`urlsRevision`). Mantener que solo super_admin las ve (el proxy ya lo garantiza).
- [ ] **Step 3:** `tsc` limpio + commit:
```bash
git add components/admin/ficha-usuario.tsx && git commit -m "feat(admin): ficha de usuario en modal con KYC, seguridad y métodos de pago (v0.0.84)"
```

---

## Task 6 — Integrar en el panel (`app/admin/page.tsx`)

**Files:**
- Modify: `app/admin/page.tsx` (pestaña Usuarios)

- [ ] **Step 1:** La página admin pasa a leer `searchParams` (`q`, `pagina`, `filtro`). En la pestaña Usuarios, llamar `buscarUsuarios(...)` y renderizar `<TablaUsuarios ... />` en vez del listado actual (`prisma.usuario.findMany take:100` + select de rol). Quitar el `usuarios` viejo del `Promise.all` (o adaptarlo). Mantener las demás pestañas (Métricas, Verificaciones, Configuración) intactas.
- [ ] **Step 2:** Asegurar que el cambio de pestaña no pierde el estado de búsqueda de forma molesta (las otras pestañas no usan `q/pagina/filtro`; está bien que solo Usuarios los use).
- [ ] **Step 3:** `tsc` limpio + verificación manual de que el dev server compila la página admin (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin` con sesión no aplica; basta tsc + que no haya error de compilación en el log del dev). Commit:
```bash
git add app/admin/page.tsx && git commit -m "feat(admin): la pestaña Usuarios usa el módulo de gestión con búsqueda y ficha (v0.0.85)"
```

---

## Task 7 — Aislar los E2E + smoke test del módulo + docs

**Files:**
- Create: `e2e/global-teardown.ts`, `e2e/global-setup.ts`
- Modify: `playwright.config.ts`
- Create/Modify: `e2e/admin-usuarios.spec.ts` (smoke)
- Modify: `docs/PRD.md`, `docs/PRD.html`, `docs/ARQUITECTURA_TECNICA.md`, `CHANGELOG.md`

- [ ] **Step 1:** `global-teardown.ts`: borra todos los usuarios `@test.local` y sus dependientes (Valoracion/Participante/Recolecta organizadas, luego usuario.delete con cascade), reusando la lógica del script de limpieza. `global-setup.ts`: la misma limpieza al inicio (deja la DB limpia antes de correr). Conectar ambos en `playwright.config.ts` (`globalSetup`, `globalTeardown`). NO borrar `qa@greensol.local` ni `luisitoys@gmail.com` (solo `endsWith @test.local`).
- [ ] **Step 2:** `e2e/admin-usuarios.spec.ts` (smoke): usando `/api/test/seed-pin`/`sesion` para entrar como super_admin (o sembrar uno `@test.local` super_admin), abrir `/admin`, ir a la pestaña Usuarios, buscar por correo, abrir una ficha, y verificar que aparece. Mantenerlo simple y determinista. Si entrar como super_admin requiere un seed especial, añadir el flag al endpoint de seed (rol) — deshabilitado en prod.
- [ ] **Step 3:** Correr `npx playwright test --reporter=line` → todo verde. Confirmar que tras la corrida NO quedan `@test.local` en la DB (el teardown limpió).
- [ ] **Step 4:** Actualizar docs (PRD/PRD.html: nuevo módulo de gestión de usuarios y roles a 2; ARQUITECTURA_TECNICA: tabla de roles, módulo admin/usuarios, aislamiento E2E) y CHANGELOG. Markdown sin hard-wrap (una línea por párrafo).
- [ ] **Step 5:** Commit:
```bash
git add e2e/ playwright.config.ts docs/ CHANGELOG.md && git commit -m "test+docs(admin): aislar E2E (@test.local), smoke de gestión de usuarios y docs (v0.0.86)"
```

---

## Self-review (cobertura del spec)

- Roles a usuario/super_admin + migración → Task 1 ✓
- Búsqueda (correo/usuario/teléfono/cédula) + paginación + filtros → Tasks 2, 4 ✓
- Acciones por íconos (ver ficha, restablecer, suspender, eliminar) → Tasks 3, 4 ✓
- Ficha modal completa (identidad, seguridad, KYC+imágenes, métodos de pago, acciones) → Tasks 2, 5 ✓
- Salvaguardas (no auto-eliminar/suspender, no quedar sin super_admin) + login de baneados → Task 3 ✓
- Aislamiento E2E (@test.local) + usar qa@greensol.local → Task 7 ✓
- Fuera de alcance (DB de test separada, edición libre de perfil, reportes) → documentado ✓
