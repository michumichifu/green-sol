# Integraciones de API externas — Green Sol

> Tasas y cotizaciones para mostrar equivalencias (Bs, USDC, SOL). **Son informativas: nunca mueven fondos.** Relacionado: [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md) §5 y [PRD.md](PRD.md) §7.

- **Versión:** 0.2 · **Fecha:** 2026-05-29

> **Regla de seguridad:** las credenciales y los detalles de integraciones **privadas** (API keys, webhooks, endpoints de servicios de uso propio) **no se publican en el repo**. En este documento público solo queda *qué* se necesita y *cómo* se configura; el detalle y las claves viven en `_privado/` (en `.gitignore`) y en variables de entorno.

---

## 1. Fuentes de datos

| Dato | Fuente | Pública | Notas |
| --- | --- | --- | --- |
| Tasas Bs: **BCV oficial** y **USDT P2P** | API externa de un proveedor venezolano | No (**privada**, uso con credencial propia) | Endpoints y key en `_privado/integraciones-privadas.md`. En código: variables de entorno. |
| Precio **SOL / USDC** | **DexScreener** | Sí (pública, sin key) | Ver §2. |

## 2. DexScreener — Precio SOL / USDC (pública)
Docs: https://docs.dexscreener.com/api/reference · Sin key · rate limit ~300 req/min.

- Precio de SOL en USD: `GET https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112` (mint de wSOL) → `pairs[].priceUsd`.
- USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`. Como USDC ≈ 1 USD, `SOL→USDC ≈ priceUsd`.

## 3. Estrategia de consulta y caché (CLAVE — no saturar las APIs)
**Nunca** llamar por usuario ni por acción. Una **consulta global** de la app, cacheada (BD/Redis) con timestamp; todos leen del caché.

| Fuente | Refresco | Hora (VET, UTC−4) |
| --- | --- | --- |
| BCV | **2× al día** | 09:00 y 16:00 |
| USDT | cada **1–2 h** | — |
| SOL/USDC (DexScreener) | cada **1–2 h** | — |

Implementar con **cron / scheduled job** (Vercel Cron). El WebSocket de USDT es opcional para una vista "en vivo" sin sumar llamadas REST.

## 4. Uso en el producto
- **Dashboard:** tasas del día **sutiles** arriba de las tarjetas (BCV, USDT promedio, SOL/USDC) con su variación.
- **Calculadora** (menú inferior): convertir **Bs** (BCV / USDT / personalizada) ↔ **USDC** ↔ **SOL**.
- **Dentro de cada san:** mostrar el equivalente **del día** ("debes pagar 20 USDT = X Bs a la tasa de hoy"), leyendo el caché global.

## 5. Seguridad (regla general)
- **Toda** credencial (API key, secreto, webhook) va en **variables de entorno** (`.env.local`, Vercel env), **nunca en el repo** (Green Sol es open source).
- Las APIs **con credencial** se llaman **desde el backend**, no desde el frontend.
- Para integraciones **privadas/de uso propio**: en el repo público solo se documenta *qué* hace falta y *de dónde* obtenerlo; el detalle (endpoints, key) va en `_privado/` (gitignored).

## 6. Aviso legal (incluir donde se muestren tasas)
Los datos de tasas provienen de https://www.bcv.org.ve. Green Sol no se responsabiliza por la veracidad ni la actualización. El **BCV es el único ente autorizado** para modificar la tasa oficial en Venezuela.
