# Changelog — Green Sol

Versionado **0.0.x** durante el desarrollo, incrementando por cada avance, hasta **v1.0** (primera versión estable / preview en vivo). A partir de v1.0 se publican *releases*.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

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
