# Bloque 7 — Capa cripto (Solana) · Pendiente de credenciales

> Estado al cierre de la sesión nocturna del 2026-05-30. El **núcleo (bloques 0–6)** está completo, verificado y en GitHub. La capa cripto requiere intervención de Luis (crear cuentas/keys de servicios externos) y por eso queda preparada pero no construida.

## Lo que ya está preparado en el núcleo
- `Recolecta.metodo` admite `cripto` (enum `MetodoRecolecta`).
- `MetodoPago` admite `wallet_usdt` y `wallet_solana` (el usuario ya puede guardar sus direcciones en el perfil).
- **Precio de SOL** en vivo (DexScreener) y la calculadora ya convierte Bs ↔ USDC ↔ SOL.
- Posicionamiento y modelo de datos listos para enchufar la wallet sin rehacer.

## Lo que falta construir (cuando tengamos credenciales)
1. **Wallet embebida no-custodial** creada al registrarse (proveedor: Privy / Web3Auth / Turnkey).
2. **Onboarding de respaldo de la llave:** popup con la dirección → popup con la llave secreta difuminada (ícono ojo para revelar/copiar, guardada bajo responsabilidad del usuario).
3. **Login con wallet** (Phantom / Solflare) por firma, sin OTP; y vinculación de métodos (correo + wallet).
4. **Depósitos, retiros y transferencias** en USDC/SOL.
5. **Bote de grupo multifirma** (Squads) para recolectas en cripto.
6. **Modo espejo** de wallet externa (lectura por RPC).
7. Todo **primero en devnet**, dinero real solo tras pruebas.

## Lo que necesito de Luis para construirlo
- **Crear cuentas y obtener API keys:**
  - Proveedor de wallet embebida (Privy / Web3Auth / Turnkey) — decidir cuál (el que permita mostrar/exportar la llave para el onboarding de respaldo).
  - **RPC dedicado** de Solana (Helius / QuickNode) — cuenta gratuita.
- **Decisiones de producto:** modelo de recuperación de cuenta/wallet; política de KYC para funciones de dinero.
- Estas keys irán en variables de entorno (`.env` / Vercel), nunca en el repo.

## Recomendación
Construir el bloque cripto como su propio ciclo (spec → plan → implementación) en devnet, con pruebas a fondo antes de tocar dinero real. No se apura porque un error con fondos es irreversible.
