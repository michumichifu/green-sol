# Auth con wallet de Solana — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un usuario se registre y entre a Green Sol con su wallet de Solana (Phantom/Solflare), usando la dirección como identidad y una firma como prueba, con PIN opcional como vía alternativa.

**Architecture:** La autenticación es off-chain: el frontend conecta la wallet (framework-kit) y firma un mensaje con un nonce de un solo uso que genera el servidor; el backend verifica la firma ed25519 contra la dirección y crea la sesión. La lógica determinista (mensaje, verificación de firma, validez del nonce) vive en `lib/auth/` y se prueba con vitest; la UI con wallet se prueba manual con Phantom en devnet.

**Tech Stack:** Next 16 / React 19, Prisma + PostgreSQL, framework-kit (`@solana/client`, `@solana/react-hooks`, `@solana/kit`), `tweetnacl` + `bs58` para verificar firmas, vitest.

**Spec:** `docs/superpowers/specs/2026-06-04-auth-wallet-solana-design.md`

---

## Estructura de archivos

- `lib/auth/wallet.ts` (crear) — `construirMensaje()` y `verificarFirma()` (lógica pura).
- `lib/auth/nonce.ts` (crear) — `esNonceUtilizable()` (pura) + helpers de DB para crear/consumir nonce.
- `tests/wallet-auth.test.ts` (crear) — unit tests de firma y nonce.
- `prisma/schema.prisma` (modificar) — `correo` opcional, `walletAddress`, `registradoCon`, modelo `AuthNonce`, enum `MetodoRegistro`.
- `app/(auth)/actions.ts` (modificar) — actions `generarNonceWallet`, `registrarConWallet`, `loginConWallet`, `loginConUsuarioPin`.
- `app/providers.tsx` (crear o modificar) — `SolanaProvider` con cliente devnet.
- `app/layout.tsx` (modificar) — envolver con el provider.
- `components/auth/wallet-conectar.tsx` (crear) — conexión Phantom/Solflare + firma.
- `app/(auth)/registro/...` (modificar) — opción "con wallet".
- `app/(auth)/login/...` (modificar) — "Entrar con wallet" / "Entrar con @usuario + PIN".
- Pantalla de perfil/configuración (modificar) — mostrar "registrado con wallet", dirección, vincular correo, crear/cambiar PIN.
- `.env` / `.env.example` (modificar) — `NEXT_PUBLIC_SOLANA_RPC_URL`.

---

## Task 0: Instalar el stack de Solana y verificar compatibilidad

**Files:**
- Modify: `package.json` (vía npm install)
- Read: `node_modules/next/dist/docs/` (guía de Next del proyecto, según AGENTS.md)

- [ ] **Step 1: Leer la guía de Next del proyecto antes de tocar nada**

Run: `ls node_modules/next/dist/docs/ && sed -n '1,80p' node_modules/next/dist/docs/*.md | head -120`
Motivo: AGENTS.md advierte que esta versión de Next tiene cambios; confirmar convenciones de `providers`/`layout`/`"use client"` antes de añadir el provider.

- [ ] **Step 2: Instalar dependencias**

Run:
```bash
npm install @solana/client @solana/react-hooks @solana/kit tweetnacl bs58
```
Expected: instala sin errores de peer-deps. Si `@solana/react-hooks` reporta incompatibilidad con React 19, **detenerse** y aplicar el Plan B (ver nota al final de esta tarea) antes de seguir.

- [ ] **Step 3: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores nuevos (los tipos de las libs resuelven).

- [ ] **Step 4: Añadir la variable de entorno del RPC**

Añadir a `.env` y `.env.example`:
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(cripto): instalar framework-kit + tweetnacl/bs58 para auth con wallet"
```

> **Plan B si framework-kit no es compatible con Next 16 / React 19:** no instalar `@solana/react-hooks`; usar el descubrimiento de wallets del estándar directamente (`@wallet-standard/app` + `@wallet-standard/features`) en `components/auth/wallet-conectar.tsx`. El backend (Tasks 1–4) no cambia. Registrar la decisión en el CHANGELOG.

---

## Task 1: Migración de esquema (identidad por wallet)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Editar el modelo `Usuario`**

Cambiar `correo String @unique` por `correo String? @unique` y añadir, junto a los campos de auth:
```prisma
  walletAddress    String?        @unique
  registradoCon    MetodoRegistro @default(correo)
```

- [ ] **Step 2: Añadir el enum y el modelo de nonce al final del schema**

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

- [ ] **Step 3: Crear y aplicar la migración**

Run: `npx prisma migrate dev --name auth_wallet`
Expected: crea `prisma/migrations/<ts>_auth_wallet/` y aplica; `correo` pasa a nullable sin pérdida de datos.

- [ ] **Step 4: Verificar el cliente Prisma**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: sin errores; `prisma.authNonce` y `usuario.walletAddress` disponibles en los tipos.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(cripto): esquema de auth con wallet (correo opcional, walletAddress, AuthNonce)"
```

---

## Task 2: Mensaje a firmar + verificación de firma (TDD)

**Files:**
- Create: `lib/auth/wallet.ts`
- Test: `tests/wallet-auth.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/wallet-auth.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { construirMensaje, verificarFirma } from "@/lib/auth/wallet";

const enc = (s: string) => new TextEncoder().encode(s);

describe("verificarFirma", () => {
  it("acepta una firma válida de la misma wallet", () => {
    const kp = nacl.sign.keyPair();
    const address = bs58.encode(kp.publicKey);
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), kp.secretKey);
    expect(verificarFirma(address, mensaje, firma)).toBe(true);
  });

  it("rechaza la firma de otra wallet", () => {
    const firmante = nacl.sign.keyPair();
    const otra = nacl.sign.keyPair();
    const address = bs58.encode(otra.publicKey);
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), firmante.secretKey);
    expect(verificarFirma(address, mensaje, firma)).toBe(false);
  });

  it("rechaza si el mensaje fue alterado", () => {
    const kp = nacl.sign.keyPair();
    const address = bs58.encode(kp.publicKey);
    const firma = nacl.sign.detached(enc(construirMensaje("abc123", "login")), kp.secretKey);
    expect(verificarFirma(address, construirMensaje("otro", "login"), firma)).toBe(false);
  });

  it("rechaza una dirección base58 inválida sin lanzar", () => {
    const kp = nacl.sign.keyPair();
    const mensaje = construirMensaje("abc123", "login");
    const firma = nacl.sign.detached(enc(mensaje), kp.secretKey);
    expect(verificarFirma("no-es-base58-válida-!!!", mensaje, firma)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verque falla**

Run: `npx vitest run tests/wallet-auth.test.ts`
Expected: FAIL — `construirMensaje`/`verificarFirma` no existen.

- [ ] **Step 3: Implementar `lib/auth/wallet.ts`**

```ts
import nacl from "tweetnacl";
import bs58 from "bs58";

const DOMINIO = "Green Sol";

export type Proposito = "registro" | "login";

/** Mensaje legible que verá el usuario en el popup de su wallet al firmar. */
export function construirMensaje(nonce: string, proposito: Proposito): string {
  const accion = proposito === "registro" ? "Registrarte en" : "Iniciar sesión en";
  return (
    `${accion} ${DOMINIO}.\n\n` +
    `Firma este mensaje para confirmar que esta wallet es tuya. ` +
    `No autoriza ninguna transacción ni gasto.\n\n` +
    `Nonce: ${nonce}`
  );
}

/** Verifica una firma ed25519 contra la dirección base58. No lanza: devuelve false ante cualquier dato inválido. */
export function verificarFirma(
  addressBase58: string,
  mensaje: string,
  firma: Uint8Array,
): boolean {
  try {
    const pubkey = bs58.decode(addressBase58);
    if (pubkey.length !== 32) return false;
    const mensajeBytes = new TextEncoder().encode(mensaje);
    return nacl.sign.detached.verify(mensajeBytes, firma, pubkey);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Correr el test y verque pasa**

Run: `npx vitest run tests/wallet-auth.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/wallet.ts tests/wallet-auth.test.ts
git commit -m "feat(cripto): mensaje a firmar + verificación de firma ed25519 (TDD)"
```

---

## Task 3: Validez del nonce (TDD) + helpers de DB

**Files:**
- Create: `lib/auth/nonce.ts`
- Modify: `tests/wallet-auth.test.ts`

- [ ] **Step 1: Añadir el test que falla**

Agregar a `tests/wallet-auth.test.ts`:
```ts
import { esNonceUtilizable } from "@/lib/auth/nonce";

describe("esNonceUtilizable", () => {
  const base = {
    usado: false,
    expiraEn: new Date("2026-06-04T12:05:00Z"),
    walletAddress: "WALLET1",
    proposito: "login",
  };
  const ahora = new Date("2026-06-04T12:01:00Z");

  it("acepta un nonce vigente, sin usar, con address y propósito correctos", () => {
    expect(esNonceUtilizable(base, "WALLET1", "login", ahora)).toBe(true);
  });
  it("rechaza null", () => {
    expect(esNonceUtilizable(null, "WALLET1", "login", ahora)).toBe(false);
  });
  it("rechaza si ya se usó", () => {
    expect(esNonceUtilizable({ ...base, usado: true }, "WALLET1", "login", ahora)).toBe(false);
  });
  it("rechaza si expiró", () => {
    const tarde = new Date("2026-06-04T12:10:00Z");
    expect(esNonceUtilizable(base, "WALLET1", "login", tarde)).toBe(false);
  });
  it("rechaza si la address no coincide", () => {
    expect(esNonceUtilizable(base, "OTRA", "login", ahora)).toBe(false);
  });
  it("rechaza si el propósito no coincide", () => {
    expect(esNonceUtilizable(base, "WALLET1", "registro", ahora)).toBe(false);
  });
});
```

- [ ] **Step 2: Correr el test y verque falla**

Run: `npx vitest run tests/wallet-auth.test.ts`
Expected: FAIL — `esNonceUtilizable` no existe.

- [ ] **Step 3: Implementar `lib/auth/nonce.ts`**

```ts
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import type { Proposito } from "@/lib/auth/wallet";

const VIGENCIA_MS = 5 * 60 * 1000; // 5 min

type NonceLike = {
  usado: boolean;
  expiraEn: Date;
  walletAddress: string;
  proposito: string;
} | null;

/** Regla pura de validez (sin DB), para poder testearla. */
export function esNonceUtilizable(
  n: NonceLike,
  address: string,
  proposito: Proposito,
  ahora: Date,
): boolean {
  if (!n) return false;
  if (n.usado) return false;
  if (n.expiraEn < ahora) return false;
  if (n.walletAddress !== address) return false;
  if (n.proposito !== proposito) return false;
  return true;
}

/** Crea y persiste un nonce nuevo para una wallet+propósito. Devuelve el string. */
export async function crearNonce(address: string, proposito: Proposito): Promise<string> {
  const nonce = randomBytes(24).toString("hex");
  await prisma.authNonce.create({
    data: {
      nonce,
      walletAddress: address,
      proposito,
      expiraEn: new Date(Date.now() + VIGENCIA_MS),
    },
  });
  return nonce;
}

/**
 * Consume un nonce: lo valida y lo marca usado en una sola operación.
 * Devuelve true si era utilizable (y queda marcado), false si no.
 */
export async function consumirNonce(
  nonce: string,
  address: string,
  proposito: Proposito,
): Promise<boolean> {
  const registro = await prisma.authNonce.findUnique({ where: { nonce } });
  if (!esNonceUtilizable(registro, address, proposito, new Date())) return false;
  await prisma.authNonce.update({ where: { nonce }, data: { usado: true } });
  return true;
}
```

- [ ] **Step 4: Correr el test y verque pasa**

Run: `npx vitest run tests/wallet-auth.test.ts`
Expected: PASS (todos).

- [ ] **Step 5: Commit**

```bash
git add lib/auth/nonce.ts tests/wallet-auth.test.ts
git commit -m "feat(cripto): nonce de un solo uso para auth con wallet (TDD)"
```

---

## Task 4: Server actions de auth con wallet

**Files:**
- Modify: `app/(auth)/actions.ts`
- Read: `lib/auth/session.ts` (usa `crearSesion`), `lib/auth/pin.ts` (usa `verificarPin`)

- [ ] **Step 1: Añadir las actions al final de `app/(auth)/actions.ts`**

Reusar lo existente: `crearSesion(usuarioId)` de `@/lib/auth/session`, `verificarPin(usuarioId, pin)` de `@/lib/auth/pin`, `prisma` de `@/lib/db`. Importar `construirMensaje`/`Proposito` y los helpers de nonce.

```ts
import { construirMensaje, verificarFirma, type Proposito } from "@/lib/auth/wallet";
import { crearNonce, consumirNonce } from "@/lib/auth/nonce";
import { verificarPin } from "@/lib/auth/pin";
import bs58 from "bs58";

/** Paso 1: el cliente pide el mensaje a firmar para una wallet+propósito. */
export async function generarNonceWallet(
  address: string,
  proposito: Proposito,
): Promise<{ mensaje: string; nonce: string }> {
  const nonce = await crearNonce(address, proposito);
  return { mensaje: construirMensaje(nonce, proposito), nonce };
}

/** Decodifica la firma (base58) y valida nonce + firma. Lanza Error con mensaje claro si algo falla. */
async function validarFirma(
  address: string,
  nonce: string,
  firmaBase58: string,
  proposito: Proposito,
): Promise<void> {
  const okNonce = await consumirNonce(nonce, address, proposito);
  if (!okNonce) throw new Error("El código de firma expiró. Intenta de nuevo.");
  const mensaje = construirMensaje(nonce, proposito);
  const firma = bs58.decode(firmaBase58);
  if (!verificarFirma(address, mensaje, firma)) {
    throw new Error("La firma no es válida.");
  }
}

/** Registro con wallet: valida firma, crea usuario con @usuario y abre sesión. */
export async function registrarConWallet(input: {
  address: string;
  firma: string;
  nonce: string;
  nombreUsuario: string;
}): Promise<{ error?: string }> {
  const usuario = input.nombreUsuario.trim();
  if (usuario.length < 3) return { error: "El usuario debe tener al menos 3 caracteres." };
  try {
    await validarFirma(input.address, input.nonce, input.firma, "registro");
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (await prisma.usuario.findUnique({ where: { walletAddress: input.address } })) {
    return { error: "Esa wallet ya está registrada. Inicia sesión." };
  }
  if (await prisma.usuario.findUnique({ where: { nombreUsuario: usuario } })) {
    return { error: "Ese nombre de usuario ya está tomado." };
  }
  const nuevo = await prisma.usuario.create({
    data: { walletAddress: input.address, nombreUsuario: usuario, registradoCon: "wallet" },
  });
  await crearSesion(nuevo.id);
  return {};
}

/** Login con wallet (firma). */
export async function loginConWallet(input: {
  address: string;
  firma: string;
  nonce: string;
}): Promise<{ error?: string }> {
  try {
    await validarFirma(input.address, input.nonce, input.firma, "login");
  } catch (e) {
    return { error: (e as Error).message };
  }
  const usuario = await prisma.usuario.findUnique({ where: { walletAddress: input.address } });
  if (!usuario) return { error: "Esa wallet no está registrada. Crea tu cuenta." };
  if (usuario.baneado) return { error: "Esta cuenta está suspendida." };
  await crearSesion(usuario.id);
  return {};
}

/** Login alterno: @usuario + PIN (sin wallet). */
export async function loginConUsuarioPin(input: {
  nombreUsuario: string;
  pin: string;
}): Promise<{ error?: string }> {
  const usuario = await prisma.usuario.findUnique({
    where: { nombreUsuario: input.nombreUsuario.trim() },
  });
  if (!usuario) return { error: "Usuario o PIN incorrectos." };
  const res = await verificarPin(usuario.id, input.pin);
  if (!res.ok) return { error: res.error ?? "Usuario o PIN incorrectos." };
  if (usuario.baneado) return { error: "Esta cuenta está suspendida." };
  await crearSesion(usuario.id);
  return {};
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores (las firmas coinciden con `crearSesion`, `verificarPin` y los tipos de Prisma).

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/actions.ts"
git commit -m "feat(cripto): server actions de registro/login con wallet y login @usuario+PIN"
```

---

## Task 5: Provider de Solana (devnet)

**Files:**
- Create/Modify: `app/providers.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Crear/extender `app/providers.tsx`**

Si ya existe un archivo de providers, añadir `SolanaProvider` envolviendo a los existentes (no reemplazar). Base (de la referencia de la skill `frontend-framework-kit.md`):

```tsx
'use client';

import React from 'react';
import { SolanaProvider } from '@solana/react-hooks';
import { autoDiscover, createClient } from '@solana/client';

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const websocketEndpoint = endpoint.replace('https://', 'wss://').replace('http://', 'ws://');

export const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  walletConnectors: autoDiscover(),
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <SolanaProvider client={solanaClient}>{children}</SolanaProvider>;
}
```

> Confirmar la firma exacta de `createClient`/`SolanaProvider` contra la doc instalada de los paquetes (o el MCP `solana-mcp-server`: "Documentation Search") antes de dar por bueno el código — el framework-kit es nuevo y la API puede variar de menor.

- [ ] **Step 2: Envolver el árbol en `app/layout.tsx`**

Importar `Providers` y envolver `{children}` (respetando la guía de Next del proyecto leída en Task 0; el provider es client, el layout puede seguir siendo server y montar `<Providers>` alrededor de los children).

- [ ] **Step 3: Verificar que arranca**

Run: `npx tsc --noEmit` y arrancar el dev server (en background) → `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login`
Expected: `tsc` limpio y HTTP 200 (la página de login carga con el provider montado).

- [ ] **Step 4: Commit**

```bash
git add app/providers.tsx app/layout.tsx
git commit -m "feat(cripto): SolanaProvider (framework-kit) apuntando a devnet"
```

---

## Task 6: Componente de conexión + firma (Phantom/Solflare)

**Files:**
- Create: `components/auth/wallet-conectar.tsx`

- [ ] **Step 1: Implementar el componente con el contrato definido**

Responsabilidad única: mostrar botones Phantom/Solflare, conectar la wallet seleccionada (vía `useWalletConnection()` de framework-kit), obtener la dirección y exponer una función `firmar(proposito)` que: (1) llama a `generarNonceWallet(address, proposito)`, (2) pide a la wallet conectada firmar el `mensaje` con la feature `solana:signMessage` del Wallet Standard, (3) devuelve `{ address, firma: bs58, nonce }` al componente padre.

Contrato de props:
```ts
type Props = {
  proposito: "registro" | "login";
  onFirmado: (datos: { address: string; firma: string; nonce: string }) => void;
  onError: (mensaje: string) => void;
};
```

Pasos internos:
- `useWalletConnection()` → lista de wallets descubiertas; filtrar/mostrar solo las cuyo nombre sea "Phantom" o "Solflare". Si ninguna está disponible → mostrar aviso con enlaces de descarga (`https://phantom.app`, `https://solflare.com`).
- Al pulsar un botón: conectar esa wallet; obtener la cuenta (`account.address`).
- Llamar `generarNonceWallet(address, proposito)` (server action) → `{ mensaje, nonce }`.
- Firmar `mensaje` con la cuenta conectada: usar la feature `solana:signMessage` del Wallet Standard (codificar el mensaje a bytes con `new TextEncoder()`), obtener la firma en bytes y convertirla a base58 con `bs58.encode`.
- Llamar `onFirmado({ address, firma, nonce })`. Capturar rechazo del usuario ("rechazaste la firma") y errores → `onError`.

> La API exacta para acceder a la cuenta conectada y firmar (¿`useWalletConnection()` expone `signMessage`, o se accede a `account.features['solana:signMessage']`?) **debe confirmarse contra la doc del paquete instalado y el MCP de Solana** ("Solana Expert: Ask For Help" / "Documentation Search"), porque la referencia de la skill cubre transacciones, no la firma de mensajes de auth. No inventar la API: verificarla primero.

- [ ] **Step 2: Verificar tipos y render**

Run: `npx tsc --noEmit`
Expected: limpio.

- [ ] **Step 3: Prueba manual de conexión**

Con el dev server y Phantom (en devnet) en el navegador, montar temporalmente el componente en `/login`, pulsar "Phantom", aprobar conexión y firma, y `console.log` del `onFirmado`. Confirmar que llega `address`, `firma` (base58) y `nonce`.

- [ ] **Step 4: Commit**

```bash
git add components/auth/wallet-conectar.tsx
git commit -m "feat(cripto): componente de conexión y firma con Phantom/Solflare"
```

---

## Task 7: UI de registro con wallet

**Files:**
- Modify: `app/(auth)/registro/` (la página/cliente de registro)
- Reuse: `components/auth/wallet-conectar.tsx`, `PanelTabs`, `CampoPin`

- [ ] **Step 1: Añadir la opción "Registrarme con wallet"**

En la pantalla de registro, añadir junto al registro por correo una vía "con wallet" (pestaña con `PanelTabs` o botón). Flujo del cliente:
1. Montar `<WalletConectar proposito="registro" onFirmado={...} onError={...} />`.
2. En `onFirmado({ address, firma, nonce })`, mostrar un campo para el **@usuario** y un botón "Crear cuenta".
3. Al confirmar, llamar `registrarConWallet({ address, firma, nonce, nombreUsuario })`.
4. Si `res.error` → mostrarlo (p. ej. "wallet ya registrada", "usuario tomado"). Si ok → redirigir al dashboard/onboarding y, opcionalmente, mostrar el paso "¿Crear un PIN?" (reusa el flujo de PIN existente, `definirPinRegistro`/equivalente).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: limpio.

- [ ] **Step 3: Prueba manual del registro**

Con Phantom en devnet: registrar una wallet nueva, poner un @usuario, crear cuenta. Verificar en DB:
Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.usuario.findFirst({where:{registradoCon:'wallet'},orderBy:{creadoEn:'desc'},select:{nombreUsuario:true,walletAddress:true,correo:true,registradoCon:true}}).then(u=>{console.log(u);return p.\$disconnect()})"`
Expected: el usuario con `walletAddress`, `nombreUsuario`, `correo: null`, `registradoCon: 'wallet'`.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/registro"
git commit -m "feat(cripto): registro con wallet (firma + @usuario + PIN opcional)"
```

---

## Task 8: UI de login (wallet o @usuario + PIN)

**Files:**
- Modify: `app/(auth)/login/` (la página/cliente de login)
- Reuse: `components/auth/wallet-conectar.tsx`, `CampoPin`

- [ ] **Step 1: Añadir las dos rutas de login**

1. **Entrar con wallet:** `<WalletConectar proposito="login" onFirmado={...} />` → en `onFirmado` llamar `loginConWallet({ address, firma, nonce })`; si ok redirigir, si error mostrarlo (p. ej. "wallet no registrada → crear cuenta").
2. **Entrar con @usuario + PIN:** campos `@usuario` + `CampoPin` → `loginConUsuarioPin({ nombreUsuario, pin })`; mostrar el error si lo hay (incluye el bloqueo por intentos que ya maneja `verificarPin`).

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: limpio.

- [ ] **Step 3: Prueba manual del login**

Con la cuenta creada en Task 7: (a) entrar firmando con la wallet → entra; (b) crear un PIN para esa cuenta y entrar con @usuario + PIN → entra; (c) PIN incorrecto → muestra error.

- [ ] **Step 4: Commit**

```bash
git add "app/(auth)/login"
git commit -m "feat(cripto): login con wallet (firma) o @usuario + PIN"
```

---

## Task 9: Perfil — identidad por wallet

**Files:**
- Modify: la pantalla de perfil/configuración (localizar con `grep -ril "monedaPreferida\|configuracion" app` y elegir la de datos de perfil)

- [ ] **Step 1: Mostrar el origen de la cuenta**

Si `usuario.registradoCon === 'wallet'`, mostrar una tarjeta "Registrado con wallet" + la dirección truncada (`address.slice(0,4) + '…' + address.slice(-4)`) copiable (reusar `components/dato-copiable.tsx`).

- [ ] **Step 2: Acciones de respaldo**

- "Vincular correo" (opcional): formulario que setea `usuario.correo` (validar formato y unicidad; reusar la verificación por OTP existente si se quiere correo verificado — si no, guardarlo como no verificado).
- "Crear / cambiar PIN": reusar el flujo de PIN existente (`hashearPin`/`definirPinRegistro` o equivalente).

- [ ] **Step 3: Verificar tipos y render**

Run: `npx tsc --noEmit` y abrir el perfil de la cuenta de wallet → ver la tarjeta y la dirección.

- [ ] **Step 4: Commit**

```bash
git add <archivos de perfil tocados>
git commit -m "feat(cripto): perfil muestra identidad por wallet + vincular correo y PIN"
```

---

## Task 10: Verificación final + documentación

**Files:**
- Modify: `CHANGELOG.md`, `package.json` (versión), `docs/PRD.md`, `docs/PRD.html`, `docs/ARQUITECTURA_TECNICA.md`

- [ ] **Step 1: Suite de verificación**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc limpio y todos los unit tests verdes (incluidos los de `wallet-auth.test.ts`).

- [ ] **Step 2: Recorrido manual completo (devnet)**

Con Phantom y Solflare: registrar con wallet (Phantom), salir, entrar firmando (Phantom), crear PIN, salir, entrar con @usuario+PIN, registrar otra cuenta con Solflare. Confirmar que cada cuenta es independiente y que el perfil muestra "registrado con wallet".

- [ ] **Step 3: Bump de versión + CHANGELOG + docs**

Subir `package.json` a la siguiente menor (bloque de funciones nuevas, p. ej. `0.3.0`), añadir entrada en `CHANGELOG.md`, y actualizar `PRD.md` / `PRD.html` / `ARQUITECTURA_TECNICA.md` (auth con wallet implementada; saldos y wallet gestionada siguen pendientes). Mencionar si se usó el Plan B de Task 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(cripto): registro/login con wallet de Solana + docs al día (v0.3.0)"
```

- [ ] **Step 5: Despliegue (cuando Luis lo pida)**

Seguir el flujo de deploy del proyecto (git push → en la VPS git pull + rebuild + `entrypoint.sh` aplica la migración `auth_wallet` + `image/builder prune -f`). Verificar HTTP 200 local y público. (Recordar: el VPS está saturado por apps de terceros; el build puede tardar.)

---

## Notas de seguridad y alcance

- La verificación de firma es **estrictamente server-side**; el nonce es de un solo uso con expiración de 5 min (anti-replay).
- **Fuera de alcance** (fases siguientes, no implementar aquí): lectura de saldos SOL/USDC, wallet gestionada por la app, transacciones en devnet, vincular wallet a cuenta de correo existente, MetaMask.
