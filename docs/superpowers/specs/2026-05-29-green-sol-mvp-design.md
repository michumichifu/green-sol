# Diseño de implementación — Green Sol

- **Fecha:** 2026-05-29
- **Estado:** propuesto (pendiente de revisión del usuario)
- **Referencias de producto:** [PRD.md](../../PRD.md) v0.5, [ARQUITECTURA_TECNICA.md](../../ARQUITECTURA_TECNICA.md), [INTEGRACIONES_API.md](../../INTEGRACIONES_API.md), [SEGURIDAD_Y_WALLETS.md](../../SEGURIDAD_Y_WALLETS.md)

> Este documento define **cómo** se construye Green Sol. El **qué** (producto) vive en el PRD v0.5; aquí no se repite, se referencia.

---

## 1. Alcance y enfoque

- **Full-stack completo y pulido.** No es un prototipo de fachada: backend real, datos reales, UI cuidada.
- **Orden:** el **núcleo (producto tradicional)** primero, con los "ganchos" de cripto ya previstos en el modelo de datos; **enseguida** la **capa cripto** como su propio bloque, primero en **devnet** y solo a dinero real cuando esté probada.
- **Ritmo:** incrementos verticales encadenados, sin pausas artificiales; cada incremento queda funcional y desplegado. Sin estimaciones de calendario; se mide por bloque completado.
- **Hito externo:** primera versión mostrable para el **1 de junio de 2026, 5:30 p.m.** (tuit con screenshot/video + URL). Para esa fecha, el núcleo desplegado y pulido hasta donde se llegue (objetivo: hasta el bloque 3–4).

## 2. Stack y arquitectura técnica

| Capa | Decisión |
| --- | --- |
| Frontend + Backend | **Next.js (App Router) + TypeScript**, Server Components + Server Actions / Route Handlers |
| UI | **Tailwind CSS + shadcn/ui**, modo light por defecto, identidad verde de marca |
| Hosting de la app | **Vercel** (auto-redeploy en cada push a `main`) |
| Base de datos | **Postgres en el VPS de Luis** (en Docker, usuario y puerto dedicados, sin tocar los sitios existentes) |
| ORM | **Prisma** |
| Conexión Vercel ↔ DB | **SSL** + **connection pooling** (PgBouncer en el VPS, o pooler de Prisma) por ser serverless |
| Autenticación | **Auth.js (NextAuth)** con adaptador Prisma; correo + contraseña, verificación por correo |
| Correo (SMTP) | **SMTP propio de Luis** (configurable desde super-admin); de ahí salen verificación, reseteo de contraseña y avisos |
| Tasas | **Vercel Cron** consulta las APIs y cachea en Postgres; la app y la calculadora leen del caché |
| Archivos (comprobantes) | Por decidir al llegar: **Vercel Blob** o bucket S3-compatible |
| Docker | `docker-compose` para Postgres local (dev) + Dockerfile/compose de producción **preparados** para el futuro despliegue de la app en el VPS (Portainer opcional) |
| Entornos | **Dev local** (Postgres en Docker) → **Vercel** (auto-deploy) |

## 3. Modelo de datos (entidades principales)

Off-chain en Postgres. Campos cripto incluidos pero inactivos hasta el bloque cripto.

- **Usuario:** id, correo (único), hash de contraseña, correo_verificado, rol (`usuario` | `admin_grupo` | `super_admin`), fechas, UTM.
- **Perfil:** usuario_id, nombre, apellido, nombre_usuario (único), foto, nacionalidad, documento (tipo, número), reputación derivada.
- **MetodoPago:** usuario_id, tipo (`efectivo` | `transferencia_bs` | `pago_movil` | `wallet_usdt` | `wallet_solana`), datos (banco, titular, número, dirección de wallet…).
- **Recolecta:** id, tipo (`san` | `vaca`), visibilidad (`privado` | `publico`), método (`tradicional` | `cripto`), moneda/tasa de referencia, meta o monto/turnos, estado, organizador(es).
- **Participante:** recolecta_id, usuario_id, estado, orden_turno.
- **Turno:** recolecta_id, participante_id, posición, estado (pendiente/cobrado).
- **Aporte / ReportePago:** recolecta_id, participante_id, monto, moneda, tasa_aplicada, comprobante (archivo), referencia, fecha, banco origen/destino, estado de validación.
- **Valoracion (reputación):** de_usuario, a_usuario, recolecta_id, voto (+1/−1), comentario, fecha.
- **Notificacion:** usuario_destino, tipo, título, cuerpo, recurso/enlace, leída, fecha.
- **TasaCache:** fuente (BCV/USDT/SOL), valores, variación, timestamp.
- **(Cripto, inactivo):** dirección de wallet del usuario, referencias del bote (multifirma), estado de KYC.

## 4. Estructura del proyecto

```
app/            rutas (App Router): (auth), (app) con bottom nav, (admin)
components/      UI (shadcn/ui) + componentes propios (toasts, campanita, calculadora…)
lib/             db (Prisma), auth, rates (APIs + caché), notifications, utils
prisma/          schema.prisma, migraciones, seed
docker/          compose dev (Postgres), Dockerfile + compose prod (futuro VPS)
```

## 5. Seguridad

**Web2 (desde el inicio):**
- Secretos solo en variables de entorno / `_privado/`, nunca en el repo (open source).
- Contraseñas con **Argon2/bcrypt**; **OTP por correo** (código aleatorio único, autogenerado, enviado al correo asociado) para verificación de cuenta y como segundo factor básico; sesiones seguras; validación de inputs (Zod); rate limiting básico en endpoints sensibles.
- OTP por correo es el 2FA del MVP; **TOTP / Google Authenticator** queda para más adelante. El **login con wallet** (Phantom/Solflare) **no** usa OTP: la firma de la wallet ya autentica.
- Postgres del VPS: usuario dedicado, SSL, firewall, principio de mínimo privilegio.

**Web3 (bloque cripto, alto estándar):**
- **No-custodial:** la app **nunca** guarda llaves privadas completas (wallet embebida MPC/TEE o llave cifrada con secreto del usuario).
- **Devnet primero**, dinero real solo tras pruebas.
- **Simular** cada transacción antes de firmar; **RPC dedicado** (Helius/QuickNode); botes de grupo con **multifirma** (Squads); validación estricta de montos/destinos.

## 6. Plan de construcción (bloques encadenados)

**Núcleo (producto tradicional):**
0. **Cimientos:** scaffolding Next.js + Tailwind + shadcn + Prisma; `docker-compose` Postgres local; conexión a la DB; primer deploy en Vercel; esqueleto de seguridad y variables de entorno.
1. **Auth + layout:** registro/login, contraseña segura + generador, **verificación por correo con OTP** (SMTP), sesión; layout general con **bottom nav**.
2. **Dashboard + tasas + calculadora:** Vercel Cron + caché de tasas; dashboard con tasas sutiles, tus recolectas y reputación; calculadora Bs ↔ USDC ↔ SOL.
3. **Sanes y vacas:** crear/gestionar recolecta (privado/público, tradicional), participantes, turnos (azar/manual).
4. **Pagos + mora + notificaciones:** cuenta destino, reporte de pago con comprobante, avisos de mora; **toasts** + **campanita**.
5. **Reputación + perfil:** valoración al cerrar, estrellitas, historial; perfil/configuración por pestañas (cuenta, perfil, datos de pago).
6. **Super-admin completo:** gestión de usuarios (ver/editar/crear/invitar), **configuración de SMTP**, envío de notificaciones, auditoría.

**Bloque cripto (su propio diseño detallado, en devnet):**
7. **Wallets y movimientos:** wallet embebida **no-custodial** creada al registrarse; **onboarding de respaldo** (popup con la dirección → popup con la llave secreta difuminada, ícono de ojo para revelar/copiar, guardada **bajo responsabilidad del usuario**, con instrucciones claras); depósitos, retiros, transferencias; recolectas en USDC/SOL; bote multifirma; modo espejo de wallet externa (Phantom/Solflare). **Login/registro con wallet** (Phantom/Solflare) por firma, sin OTP; un usuario que entró por wallet puede **vincular después correo + contraseña + OTP** si lo desea (métodos de auth combinables). Decisiones propias en §8.

**Hito 1-jun:** desplegado y pulido al menos hasta el bloque 3–4 (auth + dashboard con tasas reales + calculadora + crear san), suficiente para un video que impresione; seguir corrido con el resto.

## 7. Intervención de Luis (lo que no puedo hacer solo)

- **Crear cuentas y obtener API keys** de servicios externos: proveedor de wallet embebida (Privy/Web3Auth/Turnkey), **RPC** (Helius/QuickNode), y storage si aplica.
- **Datos de su SMTP** (para verificación/reseteo de correo).
- **Acceso al VPS** para crear la base de datos Postgres (lo usaré solo en ese paso, con cuidado, credenciales fuera del repo).
- **Decisiones de producto:** modelo de recuperación de cuenta/wallet, política de KYC, y, antes de dinero real en mainnet, consideraciones legales de manejo de fondos.

## 8. Decisiones abiertas

- Proveedor de wallet embebida (Privy / Web3Auth / Turnkey) y **modelo exacto de respaldo de la llave** que soporte el flujo de popups deseado.
- Storage de comprobantes (Vercel Blob vs S3-compatible).
- Confirmar SMTP propio vs alternativa (Resend) como respaldo.
- Set final e íconos del bottom nav.
- Detalle del algoritmo de reputación (estudiar Cashea).

## 9. Configuración de integraciones en super-admin (futuro, no MVP)

Gestión de API keys (tasas e IA: Claude/Gemini/DeepSeek) desde el panel, con asignación de uso (super-admin o global) y selección de modelo por sección. Idea concreta para más adelante; fuera del MVP.
