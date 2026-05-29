# Glosario web3 — Green Sol

Términos explicados en lenguaje llano, pensados para alguien que parte de cero. Ordenados por temas.

---

## Wallets y llaves

- **Wallet (cartera/billetera):** la "cuenta" donde vives en una blockchain. Guarda tus fondos y te permite firmar operaciones. No guarda el dinero "dentro" como una caja; guarda las **llaves** que te dan control sobre fondos que viven en la red.
- **Wallet caliente:** wallet conectada a internet (una app o extensión). Cómoda, algo más expuesta. Ej.: Phantom, Solflare.
- **Wallet fría:** wallet desconectada de internet (un dispositivo físico). Más segura, menos cómoda.
- **Wallet embebida:** wallet que una app crea por ti al registrarte con correo, sin que instales nada. En Green Sol es **no-custodial** (tú mantienes la custodia).
- **Llave pública / dirección:** tu "número de cuenta". Se puede compartir; sirve para que te envíen fondos. Ej.: `HjM4mWQU...zQPe`.
- **Llave privada:** la llave que firma y mueve tus fondos. **Secreta.** Quien la tiene, controla los fondos.
- **Frase semilla (seed phrase):** lista de 12-24 palabras que respaldan tu wallet. Si la pierdes, pierdes acceso; si alguien la ve, te roba. **Nunca se comparte ni se escribe en apps.**

## Red Solana

- **Solana:** una blockchain rápida y de comisiones muy bajas, buena para pagos y apps de consumo.
- **On-chain:** lo que vive y se verifica en la blockchain (saldos, transferencias, tokens).
- **Off-chain:** lo que vive en servidores tradicionales (perfiles, contenido, archivos pesados). En Green Sol, las notas de voz e imágenes son off-chain.
- **RPC:** la "puerta de entrada" para hablar con la red (leer saldos, enviar transacciones). Conviene usar un proveedor dedicado (Helius, QuickNode) porque los públicos son lentos.
- **Devnet:** red de **pruebas**. Tokens sin valor real, para desarrollar sin riesgo.
- **Mainnet:** la red **real**, con dinero real.
- **Airdrop (en devnet):** reclamar SOL de prueba gratis para poder experimentar.
- **Comisiones / fees:** lo que cuesta hacer una operación en la red. En Solana son fracciones de centavo.
- **Explorador:** web para ver lo que pasa on-chain (transacciones, saldos). Ej.: Solana Explorer, Solscan.

## Tokens y dinero

- **SOL:** la moneda nativa de Solana. Se usa para pagar las comisiones de red.
- **SPL Token:** el estándar de tokens en Solana (como los "tokens ERC-20" de Ethereum). Cualquier moneda o punto creado en Solana suele ser un SPL Token.
- **Stablecoin:** token cuyo valor está atado a una moneda estable, normalmente el dólar.
- **USDC / USDT:** stablecoins de dólar. En Green Sol, el bote opcional se respalda en **USDC** (dólar digital) para ahorrar en dólares estables.

## Custodia y seguridad

- **Custodial:** la app guarda tus llaves/dinero. Cómodo pero arriesgado y regulado. Green Sol **no** lo usa.
- **No-custodial:** tú mantienes el control de tus llaves/fondos; la app no puede tocarlos. Lo que usa Green Sol.
- **MPC (cómputo multiparte):** técnica que parte tu llave en pedazos para que nadie tenga la llave completa. Permite wallets fáciles y seguras a la vez.
- **TEE:** entorno de hardware aislado y seguro donde se hacen operaciones sensibles (firmas) sin exponer la llave.
- **Multifirma (multisig):** una wallet que exige varias aprobaciones para mover fondos (ej. 2 de 3). Nadie puede vaciarla solo. Es como funciona el **bote de grupo** de Green Sol.
- **Firmar:** autorizar una operación con tu llave. Sin tu firma, nadie mueve tus fondos.

## Aplicaciones

- **dApp:** "aplicación descentralizada", una app que usa una blockchain por debajo.
- **Wallet Adapter:** estándar de Solana para que una app pueda conectarse con wallets externas (Phantom, Solflare).
- **Modo espejo (término propio de Green Sol):** la app solo **lee y refleja** los datos de una wallet externa que el grupo ya tiene; no custodia ni mueve nada.
