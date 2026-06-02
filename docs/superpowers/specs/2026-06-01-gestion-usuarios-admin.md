# Gestión de usuarios (panel super-admin) — Diseño

**Fecha:** 2026-06-01
**Estado:** Aprobado (alcance: "todo lo propuesto")

## Contexto y problema

La pestaña **Usuarios** del panel super-admin hoy solo lista los 100 usuarios más recientes (nombre + correo) con un `<select>` de rol. No hay buscador, ni acciones reales, ni ficha del usuario. Además los roles incluyen `admin_grupo`, que no es un rol real. La lista era inservible porque los 100 más nuevos eran usuarios de prueba E2E (ya limpiados: quedan `luisitoys@gmail.com` y `qa@greensol.local`).

## Objetivo

Convertir la pestaña Usuarios en un módulo de administración real: buscar, ver ficha completa en pop-up, y gestionar (rol, suspender, restablecer verificación, eliminar) — todo con acciones por **íconos** (lucide), no texto. Y simplificar el modelo de roles. Además, **aislar los tests E2E** para que no vuelvan a inundar la DB real.

## Modelo de roles

Quitar `admin_grupo` del enum `Rol`. Quedan **`usuario`** y **`super_admin`**. "Organizador de un san" es una etiqueta derivada de las recolectas que la persona organiza (`Recolecta @relation("organizadas")`), NO un rol. Hoy ningún usuario tiene `admin_grupo`, así que la migración es segura.

Migración (Postgres enum, requiere SQL crudo en la migración de Prisma):
1. `UPDATE "Usuario" SET rol='usuario' WHERE rol='admin_grupo';` (defensivo, hoy afecta 0 filas).
2. Recrear el tipo enum sin `admin_grupo` (crear `Rol_new`, alterar la columna, eliminar el viejo, renombrar). Patrón estándar de Prisma para quitar un valor de enum.

## Búsqueda y listado

- **Buscador** por: `correo`, `nombreUsuario`, `telefono` (campos de `Usuario`) y **cédula** (`VerificacionKyc.numeroDocumento`; también se puede cruzar con `MetodoPago.cedula`). Búsqueda case-insensitive, `contains`. Un solo campo de texto que busca en todos.
- **Paginación** del lado del servidor (page + pageSize, p. ej. 20 por página), ordenado por `creadoEn desc`. Reemplaza el `take: 100` ciego.
- **Filtros rápidos** (chips): Todos · Verificados (nivelKyc≥1) · Sin verificar · Suspendidos (baneado).
- Cada fila muestra: foto (o inicial), nombre/usuario, correo, una **insignia de estado** (Verificado / Sin verificar / Suspendido) y el rol.
- El estado de búsqueda/página/filtro va en la URL (searchParams) para que el server component lo lea; el listado es server-rendered y las acciones revalidan.

## Acciones por fila (íconos lucide)

A la derecha de cada usuario, botones-ícono con `aria-label` y tooltip:
- 👁 **Ver ficha** (`Eye`) → abre el pop-up.
- 🔄 **Restablecer verificación** (`RotateCcw`) → vuelve a pedir el KYC.
- ⛔ **Suspender / reactivar** (`Ban` / `CircleCheck`) → alterna `baneado`.
- 🗑 **Eliminar** (`Trash2`) → borra el usuario (con confirmación).

Acciones destructivas (eliminar, suspender, restablecer, cambiar rol) piden **confirmación** en un diálogo antes de ejecutar.

## Ficha del usuario (pop-up / modal)

Client component que recibe el usuario completo (cargado en el server al abrir, o pasado desde la fila). Muestra:
- **Identidad**: foto de perfil (`fotoUrl`), nombre, apellido, nombre de usuario, correo, teléfono (+ si está verificado), país, rol, fecha de registro, nº de ingresos.
- **Métodos de seguridad actuales**: PIN (sí/no), contraseña (sí/no), OTP por correo (activo/no). Si está bloqueado por intentos, mostrarlo.
- **Verificación de identidad (KYC)**: estado actual, tipo y número de documento, nacionalidad, dirección, y **las imágenes** (frente, reverso, selfie, video) servidas por el proxy `/api/almacen/[...key]` (solo super_admin, ya existe). Fecha de revisión y revisor si aplica.
- **Métodos de pago**: lista (categoría, moneda, método, alias, titular, banco, etc.).
- **Acciones** dentro de la ficha: las mismas de la fila (restablecer verificación, suspender/reactivar, cambiar rol, eliminar), con confirmación.

Reusar el estilo de modal/pop-up que ya use el proyecto (el de la cola KYC o el de configuración). Las imágenes del KYC ya tienen un patrón de carga vía `urlsRevision`/`/api/almacen` en `app/admin/kyc-actions.ts` — reutilizarlo.

## Server actions (todas con guard `super_admin`)

En `app/admin/actions.ts` (o un `usuarios-actions.ts` nuevo si crece):
- `cambiarRol(usuarioId, rol)` — ya existe; ajustar a los 2 roles.
- `suspenderUsuario(usuarioId, suspender: boolean)` — alterna `baneado`. (El login/middleware ya debe respetar `baneado`; si no lo hace, conectarlo: un usuario baneado no inicia sesión.)
- `restablecerVerificacion(usuarioId)` — pone `nivelKyc=0` y marca la última `VerificacionKyc` como `reenvio_solicitado` (o el estado que corresponda según la máquina de estados en `lib/kyc/estados.ts`), para que al usuario le reaparezca el banner y pueda reenviar.
- `eliminarUsuario(usuarioId)` — borra el usuario manejando las FK sin cascade (Valoracion, Participante, Recolecta organizadas) antes del delete, igual que el script de limpieza ya usado. Cascade cubre Sesion/OTP/Notificacion/MetodoPago/VerificacionKyc.

**Salvaguardas de seguridad:**
- Un super-admin **no puede eliminarse ni suspenderse a sí mismo**, ni degradar su propio rol.
- No permitir quedar **sin ningún super_admin** (no degradar/eliminar al último super_admin).
- Confirmación explícita en el cliente para acciones destructivas.

## Aislamiento de los tests E2E

Los tests crean usuarios `*@test.local` con timestamp y nunca se limpiaban (inundaron la DB con 238). Para aislarlos:
- **Teardown global de Playwright** que borre todos los usuarios `*@test.local` (y sus dependientes) al terminar la suite — y un **setup global** que limpie restos antes de empezar. Reusar la lógica del script de limpieza ya probado.
- Los endpoints `/api/test/*` siguen deshabilitados en producción.
- **No crear** super-admins nuevos para QA: usar el existente `qa@greensol.local`. Documentarlo.
- (Opcional, fuera de alcance ahora: una base de datos de test separada por `DATABASE_URL`. El teardown cubre el problema inmediato.)

## Fuera de alcance

- DB de test separada (el teardown basta por ahora).
- Edición libre de todos los campos del perfil desde el admin (solo las acciones listadas).
- Exportar usuarios / reportes.

## Componentes afectados

- `prisma/schema.prisma` + migración (enum `Rol` sin `admin_grupo`).
- `app/admin/page.tsx` — la pestaña Usuarios pasa a usar el nuevo módulo con searchParams.
- `app/admin/actions.ts` (o `usuarios-actions.ts`) — las server actions de gestión.
- `components/admin/tabla-usuarios.tsx` (nuevo) — listado + buscador + filtros + acciones por íconos.
- `components/admin/ficha-usuario.tsx` (nuevo) — el modal con la ficha completa.
- `lib/admin/usuarios.ts` (nuevo) — consultas (búsqueda paginada, ficha completa con relaciones).
- `e2e/global-setup.ts` / `e2e/global-teardown.ts` (nuevos) + `playwright.config.ts` — limpieza de `@test.local`.

## Seguridad y notas

- Todo el módulo vive bajo `app/admin/` que ya exige `super_admin` (`layout.tsx`).
- Las imágenes del KYC solo se sirven por el proxy `/api/almacen` (solo super_admin).
- Eliminar es irreversible: confirmación + salvaguarda de no auto-eliminarse ni dejar el sistema sin super_admin.
