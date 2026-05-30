# Green Sol

Aplicación web (con visión a móvil) para **gestionar el ahorro en grupo de forma transparente**: el **san, bolso, pote o vaca** de toda la vida, donde todos ven cuánto se lleva ahorrado, cuánto falta, a quién le toca y quién aportó.

Proyecto desarrollado en el marco del **Solana Vibe Bootcamp (Venezuela)**. Repositorio público para que cualquiera pueda estudiarlo o hacer un fork.

> Esta carpeta contiene la **documentación previa al desarrollo** (PRD y fundación técnica). El desarrollo del MVP está por iniciar.

## La idea en una frase

Green Sol lleva el ahorro en grupo de la comunidad hispana **al mundo cripto**, fácil y con control. Su **finalidad es el ahorro en cripto sobre Solana** (USDC/SOL), de forma ordenada y profesional; y a la vez es la **puerta de entrada** para quien aún no usa cripto:

- **Puente sin cripto:** se empieza con dinero **tradicional** (Bs o efectivo), reportando pagos de forma transparente. La app organiza y lleva las cuentas; **no custodia el dinero de nadie**.
- **Destino cripto (sobre Solana):** quien quiera respalda y mueve el bote en **USDC/SOL**, verificable y sin custodia forzada (multifirma o modo espejo).

El sin-cripto reduce la fricción de entrada; **migrar al ahorro en cripto es la meta**. La app nunca custodia el dinero a la fuerza.

## Índice de documentos

| Documento | Contenido | Estado |
| --- | --- | --- |
| [docs/PRD.md](docs/PRD.md) | Documento principal de producto: visión, problema, usuarios, idea, roadmap. | Listo |
| [docs/ARQUITECTURA_TECNICA.md](docs/ARQUITECTURA_TECNICA.md) | Web2 vs Web3, stack, proveedores de wallet, multifirma, diagrama, notificaciones, auth. | Listo |
| [docs/INTEGRACIONES_API.md](docs/INTEGRACIONES_API.md) | APIs externas de tasas (BCV/USDT) y precio SOL/USDC, caché y seguridad. | Listo |
| [docs/SEGURIDAD_Y_WALLETS.md](docs/SEGURIDAD_Y_WALLETS.md) | Modelos de custodia, no-custodial, multifirma, checklist. | Listo |
| [docs/GLOSARIO_WEB3.md](docs/GLOSARIO_WEB3.md) | Glosario de términos web3 para perfil no técnico. | Listo |
| [docs/PRD.html](docs/PRD.html) | Versión visual del PRD (un solo archivo, dark/light). | Listo |

## Decisiones tomadas

- **Producto:** Green Sol — ahorro en grupo (san, bolso, pote, vaca), transparente, con reputación de usuarios. El grupo es el corazón del valor.
- **Posicionamiento cripto-first:** la finalidad es el ahorro en cripto sobre Solana; el modo sin-cripto es el puente de entrada, no el destino.
- **Modelo de wallet:** embebida no-custodial (correo) + opción de wallet externa. El bote en grupo usa **multifirma** o **modo espejo**; la app nunca custodia dinero.
- **Tasas y calculadora:** APIs externas (BCV/USDT + DexScreener para SOL/USDC) con caché global; calculadora Bs ↔ USDC ↔ SOL.
- **Plataforma:** web responsive primero (Next.js + Vercel); Android/iOS a futuro.

## Estado y cómo retomar

- **Fase actual:** Fase 0 — documentación / PRD (cerrando). **Entrega de primera versión: 1 de junio de 2026, 5:30 p.m.**
- **Pickup point:** leer este README, luego `docs/PRD.md` (v0.5) y `docs/ARQUITECTURA_TECNICA.md`.
- **Siguiente paso:** cerrar el alcance del MVP, montar el esqueleto Next.js (Fase 1) y desplegar en Vercel.

## Convenciones

- Español castellano formal, con acentos y ñ correctos.
- Sin emojis en código ni documentos. Iconografía mediante librería de iconos (Lucide) en la versión HTML.
