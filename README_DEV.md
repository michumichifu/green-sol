# Desarrollo — Green Sol

App full-stack en Next.js (App Router, TypeScript) + Tailwind v4 + shadcn/ui, datos en Postgres con Prisma. Documentación de producto en [docs/PRD.md](docs/PRD.md); diseño técnico en [docs/superpowers/specs/](docs/superpowers/specs/).

## Requisitos
- **Node 20+** (probado en 22).
- **Docker** (para el Postgres local).

## Puesta en marcha
1. Instalar dependencias: `npm install`
2. Levantar Postgres local: `docker compose -f docker/docker-compose.dev.yml up -d`
3. Variables de entorno: `cp .env.example .env.local`
4. Migrar la base de datos: `npx prisma migrate dev`
5. Arrancar en desarrollo: `npm run dev` → http://localhost:3000

> Los pasos 2 y 4 (Docker + Prisma) se habilitan al completar las tareas de base de datos del bloque 0.

## Tests
- `npm test` — Vitest.

## Scripts
- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run lint` — ESLint.

## Estructura
- `app/` — rutas (App Router) y `app/api/` (endpoints).
- `components/ui/` — componentes de shadcn/ui.
- `lib/` — utilidades (`db.ts`, `utils.ts`).
- `prisma/` — esquema y migraciones.
- `docker/` — Postgres de desarrollo.

## Identidad visual
- Verde de marca: `#0E9F6E` (light) / `#1DCB8E` (dark). Dorado (reputación): `#C8881A` / `#F5C84B`.
- Modo light por defecto. Tokens en `app/globals.css` (`--brand`, `--brand-2`, `--gold`, y `--primary` = verde).

## Crear el primer super-admin
Tras registrarte y verificar tu cuenta, promuévela por SQL:
```bash
podman exec greensol-db-dev psql -U greensol -d greensol \
  -c "UPDATE \"Usuario\" SET rol='super_admin' WHERE correo='TU_CORREO';"
```
Luego entra a `/admin` (gestión de usuarios y configuración de SMTP).

## Seguridad
- Secretos y credenciales **solo** en `.env` / variables de entorno y `_privado/`, nunca en el repo.
