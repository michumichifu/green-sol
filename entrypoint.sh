#!/bin/sh
# Aplica migraciones pendientes y arranca el servidor de Next (standalone).
set -e

echo "→ Aplicando migraciones (prisma migrate deploy)…"
node node_modules/prisma/build/index.js migrate deploy

echo "→ Iniciando Green Sol en :${PORT:-3000}…"
exec node server.js
