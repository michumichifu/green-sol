# Changelog — Green Sol

Versionado **0.0.x** durante el desarrollo, incrementando por cada avance, hasta **v1.0** (primera versión estable / preview en vivo). A partir de v1.0 se publican *releases*.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

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
