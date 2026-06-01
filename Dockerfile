# Imagen de producción de Green Sol (Next 16, output standalone).
# Multi-stage: deps → build → runner, sobre node:22-alpine.

# 1) Dependencias
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# El schema se necesita aquí porque postinstall ejecuta `prisma generate`.
COPY prisma ./prisma
RUN npm ci

# 2) Build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma necesita el cliente generado en build (postinstall ya lo hace, pero
# aseguramos tras copiar el schema).
RUN npx prisma generate
RUN npm run build

# 3) Runner (imagen final mínima)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# standalone trae server.js + node_modules mínimos; static y public van aparte.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# node_modules completo del build: el CLI de Prisma (`migrate deploy` en el
# arranque) necesita sus deps transitivas (@prisma/config y demás); copiarlo
# entero es lo robusto. Incluye el cliente y engine generados para alpine.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["./entrypoint.sh"]
