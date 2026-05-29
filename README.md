# Green Sol

Aplicación web (con visión a móvil) para **organizar ahorros y metas, solo o en grupo** (la "vaca" o "san" de toda la vida), de forma **transparente**: todos ven cuánto se lleva ahorrado, cuánto falta y quién aportó.

Proyecto desarrollado en el marco del **Solana Vibe Bootcamp (Venezuela)**. Repositorio público para que cualquiera pueda estudiarlo o hacer un fork.

> Esta carpeta contiene, por ahora, la **documentación previa al desarrollo** (PRD y fundación técnica). Todavía no hay código de la aplicación.

## La idea en una frase

Green Sol funciona en **dos niveles**:

- **Sin cripto (base):** un registro transparente de la vaca. La app lleva las cuentas; **no toca el dinero de nadie**. Cero desconfianza, funciona en cualquier país.
- **Con cripto (opcional):** quien quiera, respalda el bote con **dólares digitales (USDC) sobre Solana**, verificable y sin que la app custodie los fondos.

La cripto entra solo para dar **respaldo y transparencia**, nunca para custodiar dinero del usuario.

## Índice de documentos

| Documento | Contenido | Estado |
| --- | --- | --- |
| [docs/PRD.md](docs/PRD.md) | Documento principal de producto: visión, problema, usuarios, idea, roadmap. | Listo |
| [docs/ARQUITECTURA_TECNICA.md](docs/ARQUITECTURA_TECNICA.md) | Web2 vs Web3, stack, proveedores de wallet, multifirma, diagrama. | Listo |
| [docs/SEGURIDAD_Y_WALLETS.md](docs/SEGURIDAD_Y_WALLETS.md) | Modelos de custodia, no-custodial, multifirma, checklist. | Listo |
| [docs/GLOSARIO_WEB3.md](docs/GLOSARIO_WEB3.md) | Glosario de términos web3 para perfil no técnico. | Listo |
| [docs/PRD.html](docs/PRD.html) | Versión visual del PRD (un solo archivo, dark/light). | Listo |

## Decisiones tomadas

- **Producto:** Green Sol — ahorro/metas, individual y en grupo, transparente. Single-user como base, grupo como corazón del valor.
- **Dual con/sin cripto:** la app vale sin cripto; Solana es una capa opcional de respaldo.
- **Modelo de wallet:** embebida no-custodial (correo) + opción de wallet externa. El bote en grupo usa **multifirma** o **modo espejo**; la app nunca custodia dinero.
- **Plataforma:** web responsive primero; Android/iOS a futuro.

## Estado y cómo retomar

- **Fase actual:** Fase 0 — documentación / PRD.
- **Pickup point:** leer este README, luego `docs/PRD.md`.
- **Siguiente paso:** elegir proveedor de wallet embebida (prueba de concepto en devnet) y montar el esqueleto del MVP.

## Convenciones

- Español castellano formal, con acentos y ñ correctos.
- Sin emojis en código ni documentos. Iconografía mediante librería de iconos (Lucide) en la versión HTML.
