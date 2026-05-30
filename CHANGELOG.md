# Changelog — Green Sol

Versionado **0.0.x** durante el desarrollo, incrementando por cada avance, hasta **v1.0** (primera versión estable / preview en vivo). A partir de v1.0 se publican *releases*.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

## [0.0.9] — 2026-05-30 — QA end-to-end con Playwright

### Añadido
- **Playwright** con pruebas E2E del flujo real en navegador:
  - La home muestra la marca y el botón lleva a registro.
  - El registro lleva a la verificación por OTP.
  - El dashboard sin sesión redirige a login.
  - Flujo autenticado: dashboard + crear un san.
- Endpoint `/api/test/sesion` (solo desarrollo) para autenticar en los E2E.
- Script `npm run e2e`.

### Verificado
- 4/4 tests E2E pasan; 6/6 tests unitarios pasan.

## [0.0.8] — 2026-05-30 — Correcciones críticas (botón de inicio, deploy Vercel, hidratación)

### Corregido
- **Botón de la pantalla de inicio:** ahora lleva a registro/login (estaba como placeholder sin conectar, "no hacía nada").
- **Deploy en Vercel:** se ejecuta `prisma generate` en `build` y `postinstall`. Los deploys posteriores a v0.0.1 fallaban porque el cliente de Prisma no se generaba en Vercel.
- **Hidratación:** `suppressHydrationWarning` en `<html>` para silenciar el warning que causan extensiones del navegador (LanguageTool).

### Importante
- En Vercel, además del build, hay que configurar `DATABASE_URL` apuntando a una base de datos accesible (la del VPS) para que el runtime funcione.

## [0.0.7] — 2026-05-30 — Bloque 6: panel super-admin

### Añadido
- Panel `/admin` protegido (solo rol `super_admin`).
- **Gestión de usuarios:** listar y cambiar rol (usuario / admin_grupo / super_admin).
- **Configuración de SMTP** desde el panel (modelo `ConfiguracionApp`): el mailer usa la config de la base de datos y, si no, las variables de entorno.

### Notas
- Para crear el primer super-admin, promover la cuenta por SQL (ver `README_DEV.md`).

## [0.0.6] — 2026-05-30 — Bloque 5: reputación y perfil

### Añadido
- Modelos `Valoracion` (manito +/−) y `MetodoPago`; campos de perfil en `Usuario` (nombre, apellido, nombre de usuario, foto).
- **Cerrar recolecta** (organizador), que habilita la valoración.
- **Valorar** (manito arriba/abajo) a los demás participantes al cerrar.
- **Reputación** calculada (positivos/negativos → estrellitas doradas) mostrada en el perfil.
- **Perfil editable:** datos personales + datos de pago (efectivo, transferencia, pago móvil, wallet USDT, wallet Solana).

## [0.0.5] — 2026-05-30 — Bloque 4: notificaciones y pagos

### Añadido
- Modelos `Notificacion` y `Aporte` (estado reportado/confirmado/rechazado).
- **Notificaciones persistentes (campanita):** página de avisos con leído/no leído y "marcar leídas".
- **Toasts** disponibles (sonner con colores: verde/rojo/naranja/azul) montados en toda la app.
- **Reportar pago** (participante): monto + referencia; notifica al organizador.
- **Confirmar/rechazar pago** (organizador); notifica al participante.
- **Notificaciones automáticas** en eventos: invitación, sorteo de turnos, pago reportado, pago resuelto.

### Pendiente
- Subida de comprobante (archivo) y multa por mora; método cripto.

## [0.0.4] — 2026-05-30 — Bloque 3: sanes y vacas

### Añadido
- Modelos `Recolecta`, `Participante`, `Turno` (con enums de tipo, visibilidad, método y estado) y relaciones con `Usuario`.
- **Crear recolecta:** san (por turnos) o vaca (meta común), pública o privada, método tradicional.
- **Listado** de las recolectas del usuario y **detalle** con participantes.
- **Invitar** participantes por correo (organizador).
- **Sorteo de turnos** al azar para el san (genera el orden e inicia la recolecta).

### Pendiente
- Reportes de pago, mora y notificaciones (bloque 4); método cripto (bloque cripto).

## [0.0.3] — 2026-05-30 — Bloque 2: tasas en vivo y calculadora

### Añadido
- **Servicio de tasas:** BCV (CDN público), USDT (API privada con key) y SOL/USDC (DexScreener), normalizados a un shape simple.
- **Caché global de tasas** en base de datos (modelo `TasaCache`): toda la app y la calculadora leen del caché, sin consultar las APIs por usuario.
- **Endpoint protegido de cron** (`/api/cron/tasas`) para refrescar el caché (se programará en Vercel Cron: BCV 2×/día, USDT y SOL cada 1–2 h).
- **Resumen de tasas del día** en el dashboard (BCV, USDT, SOL).
- **Calculadora:** convierte entre Bs (BCV/USDT), USDC y SOL con las tasas del día.
- Placeholders de las pestañas Sanes, Avisos y Perfil para la navegación.

### Verificado
- El cron refresca correctamente las tres fuentes con datos reales (`bcv: ok, usdt: ok, sol: ok`).

## [0.0.2] — 2026-05-30 — Bloque 1: autenticación

Sistema de autenticación propio (sin librería externa), con verificación por OTP y sesión por cookie.

### Añadido
- Registro y login con **correo + contraseña** (política segura: mayúscula, número, símbolo) y **generador de contraseña**.
- **Verificación de cuenta por OTP** de 6 dígitos al correo (en desarrollo se imprime en consola; en producción usa SMTP por variables de entorno).
- **Sesiones propias** en base de datos con cookie httpOnly; contraseñas hasheadas con **Argon2**.
- Modelos Prisma `Sesion` y `CodigoOtp`; relaciones en `Usuario`.
- Pantallas de registro, login y verificación con la identidad de marca.
- **Layout protegido** (redirige a `/login` sin sesión) y **barra de navegación inferior** (Inicio, Sanes, Calculadora, Avisos, Perfil).
- Tests de la política de contraseña, hash y generador.

### Pendiente
- SMTP real (datos de Luis). Login con wallet y métodos combinables llegan en el bloque cripto.

## [0.0.1] — 2026-05-30 — Bloque 0: cimientos

Primer hito: el esqueleto del proyecto corre en local con base de datos, identidad de marca, framework de tests y verificación de salud de la base de datos.

### Añadido
- **Scaffolding** Next.js 16 (App Router, TypeScript) + Tailwind v4 + shadcn/ui, montado en la raíz del repositorio (conviviendo con `docs/` y `_privado/`).
- **Identidad de marca:** verde de Green Sol (`#0E9F6E` light / `#1DCB8E` dark) como color primario, tokens `--brand`/`--brand-2`/`--gold`, fuente Inter, modo light por defecto e idioma español.
- **Pantalla de bienvenida** con la marca (sol verde, tagline, botón), **security headers** (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) y `README_DEV.md`.
- **Base de datos:** Postgres 16 en contenedor (Docker/Podman, `docker/docker-compose.dev.yml`, puerto 5433) + Prisma 6 + modelo `Usuario` (con enum `Rol`) + migración inicial.
- **Health-check:** endpoint `GET /api/health` que verifica la conexión a la base de datos.
- **Tests:** Vitest configurado (carga `.env`) con pruebas del helper `cn` y del health-check contra la base de datos real.

### Notas
- App desplegará en Vercel; la base de datos de producción vivirá en el VPS (pendiente de configurar).
- Credenciales solo en `.env` / `_privado/`, nunca en el repositorio.
