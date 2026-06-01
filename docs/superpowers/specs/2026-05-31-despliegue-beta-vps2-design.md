# Diseño — Despliegue de beta de Green Sol en la VPS-2

> Fecha: 2026-05-31 · Estado: propuesto (pendiente de aprobación e implementación)

## 1. Objetivo y modelo de trabajo

Montar un **entorno de beta** de Green Sol en la VPS-2, accesible en
`https://greensol.creceideas.com`, con base de datos propia y **SMTP real**, para
probar en condiciones de producción lo que se desarrolla en local.

Modelo de trabajo acordado:

- **Local** = desarrollo e iteración rápida (`localhost:3000`; si no hay SMTP, el
  OTP se imprime en consola).
- **VPS-2** = entorno de **beta**, actualizado **periódicamente** desde local. Cada
  beta corresponde a un commit / versión `0.0.x`. El despliegue debe ser
  **repetible y barato** (`git pull` + rebuild), no un montaje de una sola vez.

## 2. Entorno descubierto en la VPS-2 (`n8n.proyecciondigital.org`)

- Debian 12, Docker 29.3.1, Compose v5.1.1. 4 vCPU, 7.8 GB RAM (~3.3 GB libres),
  148 GB disco (106 GB libres). Proveedor: Contabo.
- IPv4 pública: **89.117.73.129** (coincide con el registro DNS).
- **nginx del host** (no dockerizado) en `:80`/`:443`, reverse proxy de los
  servicios existentes; **certbot 2.1.0** con plugin nginx gestiona los SSL.
- Servicios existentes en producción (**NO TOCAR**): 4× n8n
  (`127.0.0.1:5678–5681`), evolution-api (`127.0.0.1:8080`), chatwoot
  (`127.0.0.1:3000`), portainer agent (`:9001`), varios redis/postgres.
- Puerto **`127.0.0.1:3100` libre** → asignado a Green Sol (evita el choque con
  Chatwoot, que usa el 3000).
- **SMTP saliente abierto** (25/465/587) hacia `mail.creceideas.com` y externos.
  El caso `CONTABO_SMTP_CASE.md` es de la VPS-1 (límite de puerto 25 por reintentos
  a un buzón lleno) y no afecta a este envío autenticado por 465.
- Stacks docker viven en `/opt` (chatwoot, evolution-api) y `/root` (n8n). Green
  Sol irá en **`/opt/greensol`** (consistente con el patrón existente).

## 3. Arquitectura

```
Cloudflare DNS:  A  greensol.creceideas.com -> 89.117.73.129  (DNS only / gris)  [ya creado]
        |
   nginx del host  :443 ──(SSL certbot)── server block greensol.creceideas.com
        |  proxy_pass http://127.0.0.1:3100
   127.0.0.1:3100
        |
  [contenedor web]  Next 16 (output standalone, node server.js)
        |  red interna docker (greensol_net)
  [contenedor db]   Postgres 16  (sin exponer a internet, volumen persistente)
```

- **DNS en gris (DNS only)** al inicio para que certbot emita el SSL por HTTP-01
  sin que Cloudflare intercepte. Opcional: pasar a "proxied / Full (strict)" luego.
- Se sigue **exactamente** el patrón de los demás servicios: contenedor escuchando
  en `127.0.0.1:<puerto>` y nginx del host como única fachada en 80/443.

## 4. Cambios en el repositorio

- `next.config.ts`: añadir `output: "standalone"`.
- `Dockerfile` multi-stage (deps → build → runner) sobre `node:22-alpine`:
  - copia `.next/standalone`, y **manualmente** `.next/static` y `public`
    (standalone no los incluye por defecto).
  - Prisma: copiar `prisma/`, generar cliente en build, engine disponible en runtime.
- `.dockerignore` (excluir `node_modules`, `.next`, `.env`, `_privado`, etc.).
- `docker-compose.prod.yml`: servicios `web` y `db`, volumen `greensol_pgdata`,
  red interna, `web` publicado solo en `127.0.0.1:3100:3000`.
- `entrypoint.sh`: `prisma migrate deploy` y luego `node server.js`.
- `docs/DESPLIEGUE_VPS.md`: pasos de primer despliegue y de re-despliegue de betas.

> El `AGENTS.md` exige leer la doc local de Next 16 antes de escribir código;
> `output: "standalone"` y el flujo Docker están confirmados en
> `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md`.

## 5. Variables de entorno (en `/opt/greensol/.env`, NUNCA en el repo)

- `DATABASE_URL=postgresql://greensol:<pass>@db:5432/greensol?schema=public`
- `SMTP_HOST=mail.creceideas.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`
- `SMTP_USER=no-responder@greensol.creceideas.com`, `SMTP_PASS=<buzón>`
- `SMTP_FROM=Green Sol <no-responder@greensol.creceideas.com>`
- `DOLARVZLA_API_KEY=<key>`, `CRON_SECRET=<secreto>`

## 6. Flujo de primer despliegue

1. VPS-2: `git clone https://github.com/michumichifu/green-sol.git /opt/greensol`.
2. Crear `/opt/greensol/.env` con los secretos (§5).
3. `docker compose -f docker-compose.prod.yml up -d --build` (levanta `db` + `web`;
   las migraciones corren en el entrypoint).
4. nginx: crear server block `greensol.creceideas.com` → `proxy_pass 127.0.0.1:3100`;
   `certbot --nginx -d greensol.creceideas.com` para el SSL.
5. Verificar `https://greensol.creceideas.com`.
6. Registrarse → promover la cuenta a `super_admin` por SQL → cargar SMTP en el
   panel y **enviar correo de prueba** (valida auth del buzón).
7. Cron de tasas: crontab del host que pega a `/api/cron/tasas` con `CRON_SECRET`
   (cada 1–2 h) — o dejarlo manual al inicio de la beta.

## 7. Re-despliegue de betas (repetible)

```
cd /opt/greensol && git pull && \
  docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones de Prisma corren solas en el entrypoint. Opcional: encapsular en
`scripts/deploy.sh`.

**Persistencia de datos:** el rebuild reconstruye **solo la imagen de la app**
(contenedor `web`). La base de datos vive en un **volumen Docker persistente**
(`greensol_pgdata`), independiente del contenedor: `up -d --build`, reinicios y
`docker compose down` **no** borran los datos. Solo se perderían con
`docker compose down -v` o al eliminar el volumen a mano — nunca en un
re-despliegue normal.

## 8. Seguridad y no-regresión

- No tocar contenedores, configs de nginx ni certs de n8n/chatwoot/evolution.
- Postgres de Green Sol **sin puerto público** (solo red interna del compose).
- Secretos solo en `/opt/greensol/.env`; el repo es público.
- Verificar tras desplegar que los servicios existentes siguen intactos
  (`docker ps` sin cambios; subdominios de n8n/chatwoot/evolution responden).

## 9. Definición de "hecho" (verificación)

- `https://greensol.creceideas.com` responde 200 con certificado válido.
- Registro + OTP **llega por correo real**.
- Dashboard, tasas y calculadora cargan.
- Los servicios previos de la VPS-2 siguen funcionando.

## 10. Riesgos / pendientes menores

- **Memoria del build** de Next en la VPS-2 (~3.3 GB libres). Si el build falla por
  OOM: añadir swap temporal o limitar con `NODE_OPTIONS=--max-old-space-size`.
- Cron de tasas: crontab del host vs. dejarlo manual al inicio.
- Botón "enviar correo de prueba" en el panel admin (mejora opcional ya iniciada)
  facilita validar el SMTP sin recorrer todo el flujo de registro.

## 11. Seguridad: postura beta vs. producción

Green Sol es una fintech con finalidad cripto/web3 (Solana). El nivel de seguridad
exigido difiere según la fase. Esta sección es explícita para no confundir una cosa
con la otra.

### Adecuado para esta BETA (funcionalidad, sin dinero real)
- Postgres **sin puerto público** (solo red interna de Docker).
- **TLS/HTTPS** con certbot; contraseñas con **Argon2**; sesiones httpOnly;
  security headers.
- Secretos **fuera del repo**, en `/opt/greensol/.env` con permisos restringidos.

### Requerido ANTES de producción que custodie/mueva valor (hardening — pendiente)
- **Aislamiento de infraestructura:** la VPS-2 es un host **compartido** con n8n y
  servicios de clientes. Aceptable para una beta; **no** para producción fintech.
  Producción debería ir en **VPS exclusiva/aislada**, con la capa cripto separada.
- **Acceso SSH:** hoy por contraseña, débil y reutilizada en ambas VPS. Producción:
  solo llaves, `PasswordAuthentication no`, rotar la clave.
- **Firewall** (ufw/nftables) + fail2ban; actualizaciones de seguridad automáticas.
- **Backups automáticos cifrados y probados** (restore verificado), cifrado en reposo.
- **Gestión de secretos** más robusta que `.env` plano (Docker secrets/Vault) + rotación.
- **Monitoreo/alertas**, logging centralizado, rate limiting, **WAF** (Cloudflare
  proxied, modo Full strict), 2FA obligatorio, auditoría de accesos.
- **Cumplimiento** KYC/AML cuando se maneje dinero real.

### Capa cripto/web3 (bloque aparte, crítico)
Las llaves privadas / wallet embebida **nunca** se almacenan en texto plano en el
servidor. El PRD define no-custodial con **MPC/TEE** (Privy/Turnkey). Este despliegue
**no** incluye ni toca esa capa: la beta arranca en modo fiat/funcional.
