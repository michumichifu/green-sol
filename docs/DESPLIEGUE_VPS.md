# Despliegue de la beta en el VPS-2

> Host: **VPS-2** (`n8n.proyecciondigital.org` · `89.117.73.129`). Debian 12, Docker.
> Subdominio: **`https://greensol.creceideas.com`** (Cloudflare A → la IP, DNS only).
> **NO TOCAR** los servicios existentes (n8n, chatwoot, evolution-api). Green Sol
> vive aislada en `/opt/greensol`, contenedores en su propia red, publicada solo
> en `127.0.0.1:3100`; nginx del host es la única fachada en 80/443.

## Arquitectura

```
nginx host :443 (certbot) ── server block greensol.creceideas.com
        └─ proxy_pass http://127.0.0.1:3100
127.0.0.1:3100 → contenedor web (Next standalone)
        └─ red interna greensol_net → db (Postgres 16) + minio (S3 privado)
```

## 1. Variables de entorno (`/opt/greensol/.env`, NUNCA al repo)

```env
# App
NODE_ENV=production
CRON_SECRET=<secreto largo>
DOLARVZLA_API_KEY=<key>

# Base de datos (la usa el compose para componer DATABASE_URL)
POSTGRES_USER=greensol
POSTGRES_PASSWORD=<clave fuerte>
POSTGRES_DB=greensol

# MinIO (almacenamiento privado de documentos KYC)
MINIO_ROOT_USER=greensol
MINIO_ROOT_PASSWORD=<clave fuerte>
S3_BUCKET=greensol-kyc

# SMTP (correo real de la beta)
SMTP_HOST=mail.creceideas.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-responder@greensol.creceideas.com
SMTP_PASS=<clave del buzón>
SMTP_FROM=Green Sol <no-responder@greensol.creceideas.com>
```

`DATABASE_URL`, `S3_ENDPOINT` y las credenciales S3 las inyecta `docker-compose.prod.yml`
apuntando a los servicios internos `db` y `minio` — no hay que ponerlas a mano.

## 2. Primer despliegue

```bash
ssh root@89.117.73.129
mkdir -p /opt/greensol && cd /opt/greensol
git clone https://github.com/michumichifu/green-sol.git .
# crear el .env de arriba con nano /opt/greensol/.env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f web   # ver migrate deploy + arranque
```

El contenedor `web` aplica las migraciones (`prisma migrate deploy`) al arrancar.
El bucket `greensol-kyc` se crea solo al primer uso (helper `asegurarBucket`).

## 3. Subir la base de datos local a la beta (opcional, una vez)

```bash
# En local:
pg_dump "postgresql://greensol:greensol_dev@localhost:5433/greensol" -Fc -f /tmp/greensol.dump
scp /tmp/greensol.dump root@89.117.73.129:/opt/greensol/

# En el VPS (el esquema ya existe por migrate deploy; --data-only evita choques):
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U greensol -d greensol --data-only --disable-triggers \
  < /opt/greensol/greensol.dump
```

> Los archivos KYC de local (en el MinIO local) no se copian con la DB; las filas
> apuntarán a *keys* inexistentes en el MinIO del VPS. Para una beta limpia es
> preferible **no** migrar verificaciones, o re-subir los archivos.

## 4. nginx + SSL (certbot)

Crear `/etc/nginx/sites-available/greensol.creceideas.com`:

```nginx
server {
    server_name greensol.creceideas.com;
    client_max_body_size 25m;   # documentos KYC (video hasta 20 MB)
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    listen 80;
}
```

```bash
ln -s /etc/nginx/sites-available/greensol.creceideas.com /etc/nginx/sites-enabled/
nginx -t          # SIEMPRE validar antes de recargar (no romper los otros sitios)
systemctl reload nginx
certbot --nginx -d greensol.creceideas.com   # DNS en gris para HTTP-01
```

## 5. Re-despliegue de una nueva beta

```bash
cd /opt/greensol
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Verificación

```bash
curl -I https://greensol.creceideas.com        # 200/307
docker compose -f docker-compose.prod.yml logs --tail=50 web
```
