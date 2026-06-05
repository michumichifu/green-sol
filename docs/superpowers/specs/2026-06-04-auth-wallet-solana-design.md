# Diseño — Registro y login con wallet de Solana

- **Fecha:** 2026-06-04
- **Estado:** Diseño aprobado, pendiente de plan de implementación
- **Alcance:** Autenticación (registro + login) con la wallet externa del usuario (Phantom/Solflare). Es el primer paso de la capa cripto del bootcamp.

## Objetivo

Permitir que un usuario se **registre y entre a Green Sol con su wallet de Solana** (Phantom o Solflare), usando la dirección de la wallet como identidad y una firma criptográfica como prueba de propiedad. El registro no requiere correo. Opcionalmente el usuario puede crear un PIN como vía de acceso alternativa. En el perfil se refleja que su cuenta es "con wallet".

Esto cumple la parte del bootcamp de integrar wallets de Solana de forma real. **La autenticación es off-chain** (firma de un mensaje, criptografía ed25519): no gasta SOL ni toca la red, por lo que no requiere devnet ni saldo.

## Por qué importa / visión a futuro (contexto, no alcance de este spec)

La conexión de wallet es el cimiento de fases posteriores que este diseño **habilita pero no implementa**:

- **Lectura de saldos** del usuario (SOL/USDC y su equivalente en fiat) como parte de los métodos de ahorro.
- **Wallet gestionada por la app**: la wallet externa del usuario (Phantom/Solflare) es su identidad/llave; a futuro la app le autogenera una wallet propia para depositar/retirar y participar en sanes de SOL/USDC, sin tocar la wallet personal del usuario.

Por eso se adopta el stack completo de Solana (framework-kit + `@solana/kit`) desde ahora, aunque para la sola autenticación bastaría con menos.

## Decisiones tomadas (brainstorming)

1. **Wallets soportadas:** Phantom y Solflare, con botones fijos (las más usadas en Venezuela). MetaMask queda fuera (es de Ethereum; su Snap de Solana es experimental).
2. **Identidad:** la wallet (pubkey). El correo pasa a opcional; se puede vincular después desde el perfil.
3. **Datos mínimos al registrar con wallet:** solo un `@usuario`. Nombre real y demás quedan opcionales.
4. **PIN:** opcional, se ofrece crear al final del registro.
5. **Login — dos rutas:** (a) firmar con la wallet (seguro por sí solo: la wallet pide su clave al abrirse); (b) `@usuario` + PIN (para equipos sin la wallet instalada).
6. **Stack técnico:** framework-kit completo (`@solana/client` + `@solana/react-hooks` + `@solana/kit`), para dejar la base lista para saldos y wallet gestionada.

## Flujo

### Registro con wallet

1. El usuario elige "Registrarme con wallet" → botones **Phantom / Solflare**.
2. Conecta la wallet → la app obtiene su **dirección** (pubkey, base58).
3. El servidor genera un **nonce** de un solo uso y arma un mensaje legible (dominio + propósito + nonce); la wallet lo **firma** (`signMessage`).
4. El backend **verifica la firma** (ed25519) contra la dirección. Si es válida y el nonce no expiró ni se usó, continúa.
5. Pide un **`@usuario`** (único). Crea el `Usuario` con `walletAddress`, `nombreUsuario`, `registradoCon = wallet`, `correo = null`.
6. (Opcional) ofrece **crear un PIN** (reutiliza el flujo de PIN existente).
7. Crea la sesión (`crearSesion(usuario.id)`).

### Login con wallet (firma)

1. "Entrar con wallet" → detecta Phantom/Solflare, el usuario conecta.
2. El servidor genera nonce → la wallet firma → el backend verifica.
3. Busca el `Usuario` por `walletAddress`. Si existe → sesión. Si no existe → mensaje "esa wallet no está registrada, ¿crear cuenta?".

### Login con @usuario + PIN

1. "Entrar con PIN" → el usuario escribe su `@usuario` y su PIN.
2. El backend busca por `nombreUsuario`, valida el PIN con la lógica existente (`lib/auth/pin.ts` / `credencial.ts`, con su bloqueo por intentos) → sesión.

## Modelo de datos (Prisma)

Cambios en `model Usuario`:

- `correo String?` (era `String`), sigue `@unique` (en Postgres varios `NULL` no violan unicidad).
- `walletAddress String? @unique` (nuevo).
- `registradoCon MetodoRegistro @default(correo)` (nuevo).

Nuevo enum y modelo:

```prisma
enum MetodoRegistro {
  correo
  wallet
}

model AuthNonce {
  id            String   @id @default(cuid())
  nonce         String   @unique
  walletAddress String
  proposito     String   // "registro" | "login"
  usado         Boolean  @default(false)
  expiraEn      DateTime
  creadoEn      DateTime @default(now())

  @@index([walletAddress])
}
```

Migración: `auth_wallet` (correo a opcional + `walletAddress` + `registradoCon` + tabla `AuthNonce` + enum). Cambiar la columna `correo` de `NOT NULL` a `NULL` es seguro y no pierde datos.

## Frontend

- **Provider de Solana:** añadir `SolanaProvider` (framework-kit) en el árbol de providers de la app. Se configura con un cliente apuntando a **devnet** (aunque la autenticación no use RPC, deja el cliente listo para la fase de saldos).
- **`components/auth/wallet-conectar.tsx`:** botones Phantom/Solflare, conectar (`useWalletConnection()`), y firmar el nonce con la cuenta conectada. Si la wallet no está instalada → aviso con enlace de descarga.
- **Registro:** en `app/(auth)/registro`, añadir la opción "con wallet" (pestaña o botón) junto al registro por correo, reutilizando `PanelTabs`. Tras firmar, pedir `@usuario` y ofrecer PIN.
- **Login:** en `app/(auth)/login`, añadir "Entrar con wallet" (firma) y "Entrar con PIN" (`@usuario` + PIN), reutilizando `CampoPin`.

Mantener el estilo y los componentes existentes (botones, `PanelTabs`, `CampoPin`) para que sea coherente con la app actual.

## Backend

Nuevo `lib/auth/wallet.ts` (lógica pura, testeable):

- `construirMensaje(nonce, proposito)` → string legible que se mostrará en el popup de la wallet (incluye dominio "Green Sol", propósito y nonce).
- `verificarFirma(addressBase58, mensaje, firmaBytes)` → `boolean` (ed25519 con `tweetnacl` + `bs58`).

Server actions (junto a las de auth actuales en `app/(auth)/actions.ts`):

- `generarNonceWallet(address, proposito)` → crea `AuthNonce` (expira en 5 min), devuelve el mensaje a firmar.
- `registrarConWallet({ address, firma, nonce, nombreUsuario })` → valida nonce (existe, no usado, no expirado, coincide address+proposito) → verifica firma → marca nonce usado → crea usuario + sesión. Errores: address ya registrada, `@usuario` tomado, firma inválida, nonce expirado.
- `loginConWallet({ address, firma, nonce })` → valida nonce + firma → busca usuario por `walletAddress` → sesión, o error "no registrada".
- `loginConUsuarioPin({ nombreUsuario, pin })` → busca por `nombreUsuario` → valida PIN con la lógica existente (bloqueo por intentos incluido) → sesión.

Dependencias nuevas: `@solana/client`, `@solana/react-hooks`, `@solana/kit` (framework-kit), `tweetnacl`, `bs58`.

## Perfil

En la pantalla de perfil/configuración:

- Mostrar **"Registrado con wallet"** + la **dirección truncada** (`7xK…9mP`) copiable.
- Acción **vincular correo** (opcional, para recibir avisos por email).
- Acción **crear / cambiar PIN**.

## Manejo de errores

- Wallet no instalada → aviso con enlace de descarga de Phantom/Solflare.
- Firma cancelada o rechazada por el usuario → mensaje claro, permitir reintentar.
- Nonce expirado o ya usado → regenerar y pedir firmar de nuevo.
- Dirección ya registrada (en registro) → sugerir ir a login.
- Wallet no registrada (en login con firma) → sugerir registro.
- `@usuario` ya tomado → pedir otro.
- PIN incorrecto → reutiliza el bloqueo por intentos existente.

## Testing

- **Unit (backend, vitest):** en `lib/auth/wallet.test.ts`, generar un par de llaves con `tweetnacl`, firmar un mensaje y verificar que `verificarFirma` devuelve `true`; con una firma alterada o address distinta, `false`. Probar el ciclo del nonce: válido una sola vez, rechazado si expiró o ya se usó.
- **Front:** la conexión con wallet real no es automatizable con Playwright (no hay Phantom en el navegador de test). Se verifica **manual** con Phantom en devnet. Los E2E existentes no se tocan.

## Fuera de alcance (YAGNI — fases siguientes)

- Lectura de saldos (SOL/USDC) — la habilita este diseño, se implementa después.
- Wallet gestionada por la app (autogenerada para sanes cripto).
- Transacciones on-chain / pagos en devnet.
- Vincular una wallet a una cuenta de correo ya existente.
- MetaMask.
- Recuperación de cuenta si el usuario pierde la wallet **y** no creó PIN ni vinculó correo (queda como riesgo asumido, mitigado por el PIN y el correo opcionales).

## Riesgos

- **Compatibilidad del framework-kit:** es muy nuevo y el proyecto corre una versión modificada de **Next 16.2.6 / React 19.2.4**. Antes de escribir código hay que leer la guía de Next del proyecto (`node_modules/next/dist/docs/`, según `AGENTS.md`) y validar que `@solana/react-hooks` funcione con React 19 en este Next. **Plan B** si choca: conectar con el estándar de wallets directamente (`@wallet-standard/*`) manteniendo el mismo flujo de firma/verificación; el backend no cambia.
- **Seguridad de la firma:** el mensaje debe incluir dominio + nonce de un solo uso con expiración corta para evitar replay/phishing. La verificación es estrictamente server-side.
