# Bloque 1 — Autenticación · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Registro/login con correo + contraseña segura + verificación por OTP al correo, sesión por cookie, y el layout de la app con bottom nav protegido.

**Architecture:** Auth propia, no librería. Sesiones en Postgres (tabla `Sesion`) con cookie httpOnly. Contraseñas con Argon2 (`@node-rs/argon2`, binarios prebuilt). OTP de 6 dígitos hasheado en DB (tabla `CodigoOtp`) con expiración. Validación con Zod. Lógica vía Server Actions. Envío de correo abstraído en `lib/mailer.ts` (en dev imprime el OTP en consola; en prod usa nodemailer + SMTP por variables de entorno).

**Tech Stack:** Next.js 16 (Server Actions), Prisma 6, @node-rs/argon2, zod, nodemailer.

> **Alcance:** solo Bloque 1. Decisiones del spec: [2026-05-29-green-sol-mvp-design.md](../specs/2026-05-29-green-sol-mvp-design.md) §14. El login con wallet y la vinculación de métodos son del Bloque 7 (cripto); aquí se deja el modelo preparado.

---

## File Structure

- `prisma/schema.prisma` — añadir modelos `Sesion` y `CodigoOtp`; ampliar `Usuario`.
- `lib/auth/password.ts` — hash y verificación (Argon2) + política y generador.
- `lib/auth/session.ts` — crear/leer/destruir sesión (cookie + DB).
- `lib/auth/otp.ts` — generar, guardar y validar OTP.
- `lib/mailer.ts` — envío de correo (dev: consola; prod: SMTP).
- `lib/validations/auth.ts` — esquemas Zod (registro, login, OTP).
- `app/(auth)/registro/page.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/verificar/page.tsx` — pantallas.
- `app/(auth)/actions.ts` — Server Actions (registrarse, iniciarSesion, verificarOtp, reenviarOtp, cerrarSesion).
- `app/(app)/layout.tsx` — layout protegido con bottom nav.
- `app/(app)/dashboard/page.tsx` — placeholder protegido.
- `components/bottom-nav.tsx` — navegación inferior.
- `components/ui/input.tsx`, `label.tsx` — componentes shadcn.
- `tests/auth.test.ts` — política de contraseña, hash, OTP.

---

## Task 1: Modelos de datos (Sesion, CodigoOtp)

**Files:** Modify `prisma/schema.prisma`.

- [ ] **Step 1: Añadir modelos y relaciones**

```prisma
model Usuario {
  id               String      @id @default(cuid())
  correo           String      @unique
  hashContrasena   String?
  correoVerificado Boolean     @default(false)
  rol              Rol         @default(usuario)
  creadoEn         DateTime    @default(now())
  sesiones         Sesion[]
  codigosOtp       CodigoOtp[]
}

model Sesion {
  id         String   @id @default(cuid())
  usuarioId  String
  usuario    Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  expiraEn   DateTime
  creadaEn   DateTime @default(now())
}

model CodigoOtp {
  id         String     @id @default(cuid())
  usuarioId  String
  usuario    Usuario    @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  hashCodigo String
  proposito  OtpProposito
  expiraEn   DateTime
  usado      Boolean    @default(false)
  creadoEn   DateTime   @default(now())
}

enum OtpProposito {
  verificacion
  reset_contrasena
}
```

- [ ] **Step 2: Migración**

Run: `DATABASE_URL="postgresql://greensol:greensol_dev@localhost:5433/greensol?schema=public" npx prisma migrate dev --name auth`
Expected: crea la migración y aplica; cliente regenerado.

- [ ] **Step 3: Commit** (`v0.0.2` — modelos de auth).

---

## Task 2: Contraseñas (hash, política, generador)

**Files:** Create `lib/auth/password.ts`, `lib/validations/auth.ts`. Install `@node-rs/argon2`, `zod`.

- [ ] **Step 1: Instalar** `npm i @node-rs/argon2 zod`

- [ ] **Step 2: `lib/auth/password.ts`**

```typescript
import { hash, verify } from "@node-rs/argon2";

export function hashContrasena(plano: string): Promise<string> {
  return hash(plano);
}
export function verificarContrasena(hashGuardado: string, plano: string): Promise<boolean> {
  return verify(hashGuardado, plano);
}

const SIMBOLOS = "!@#$%^&*()-_=+[]{};:,.?";
export function generarContrasena(largo = 16): string {
  const mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minus = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const todos = mayus + minus + nums + SIMBOLOS;
  const base = [pick(mayus), pick(minus), pick(nums), pick(SIMBOLOS)];
  for (let i = base.length; i < largo; i++) base.push(pick(todos));
  return base.sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join("");
}
function pick(set: string): string {
  return set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
}
```

- [ ] **Step 3: `lib/validations/auth.ts`** (política de contraseña con Zod)

```typescript
import { z } from "zod";

export const contrasenaSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[0-9]/, "Al menos un número")
  .regex(/[^A-Za-z0-9]/, "Al menos un símbolo");

export const registroSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: contrasenaSchema,
});

export const loginSchema = z.object({
  correo: z.string().email("Correo inválido"),
  contrasena: z.string().min(1, "Requerida"),
});

export const otpSchema = z.object({
  codigo: z.string().regex(/^\d{6}$/, "Código de 6 dígitos"),
});
```

- [ ] **Step 4: Test** `tests/auth.test.ts` — validar que `contrasenaSchema` rechaza débiles y acepta fuertes, y que `hash`/`verify` funcionan. Run `npm test`. Commit (`v0.0.3`).

---

## Task 3: OTP y mailer

**Files:** Create `lib/auth/otp.ts`, `lib/mailer.ts`. Install `nodemailer`.

- [ ] **Step 1: Instalar** `npm i nodemailer && npm i -D @types/nodemailer`

- [ ] **Step 2: `lib/mailer.ts`** (dev: consola; prod: SMTP)

```typescript
import nodemailer from "nodemailer";

export async function enviarCorreo(a: string, asunto: string, texto: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`\n[CORREO DEV] Para: ${a}\nAsunto: ${asunto}\n${texto}\n`);
    return;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to: a, subject: asunto, text: texto });
}
```

- [ ] **Step 3: `lib/auth/otp.ts`** (generar 6 dígitos, hashear, guardar, validar, enviar)

```typescript
import { prisma } from "@/lib/db";
import { hash, verify } from "@node-rs/argon2";
import { enviarCorreo } from "@/lib/mailer";
import type { OtpProposito } from "@prisma/client";

const VIGENCIA_MIN = 10;

export async function crearYEnviarOtp(usuarioId: string, correo: string, proposito: OtpProposito) {
  const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const hashCodigo = await hash(codigo);
  const expiraEn = new Date(Date.now() + VIGENCIA_MIN * 60_000);
  await prisma.codigoOtp.create({ data: { usuarioId, hashCodigo, proposito, expiraEn } });
  await enviarCorreo(correo, "Tu código de Green Sol", `Tu código es: ${codigo} (válido ${VIGENCIA_MIN} minutos).`);
}

export async function validarOtp(usuarioId: string, proposito: OtpProposito, codigo: string): Promise<boolean> {
  const registro = await prisma.codigoOtp.findFirst({
    where: { usuarioId, proposito, usado: false, expiraEn: { gt: new Date() } },
    orderBy: { creadoEn: "desc" },
  });
  if (!registro) return false;
  const ok = await verify(registro.hashCodigo, codigo);
  if (ok) await prisma.codigoOtp.update({ where: { id: registro.id }, data: { usado: true } });
  return ok;
}
```

- [ ] **Step 4: Commit** (`v0.0.4` — OTP + mailer).

---

## Task 4: Sesiones

**Files:** Create `lib/auth/session.ts`.

- [ ] **Step 1: `lib/auth/session.ts`** (crear/leer/destruir; cookie httpOnly)

```typescript
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE = "greensol_session";
const DIAS = 30;

export async function crearSesion(usuarioId: string) {
  const expiraEn = new Date(Date.now() + DIAS * 86_400_000);
  const sesion = await prisma.sesion.create({ data: { usuarioId, expiraEn } });
  (await cookies()).set(COOKIE, sesion.id, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", expires: expiraEn, path: "/",
  });
}

export async function obtenerUsuario() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const sesion = await prisma.sesion.findUnique({ where: { id }, include: { usuario: true } });
  if (!sesion || sesion.expiraEn < new Date()) return null;
  return sesion.usuario;
}

export async function cerrarSesion() {
  const store = await cookies();
  const id = store.get(COOKIE)?.value;
  if (id) await prisma.sesion.deleteMany({ where: { id } });
  store.delete(COOKIE);
}
```

- [ ] **Step 2: Commit** (`v0.0.5` — sesiones).

---

## Task 5: Server Actions

**Files:** Create `app/(auth)/actions.ts`.

- [ ] **Step 1: Acciones** registrarse, iniciarSesion, verificarOtp, reenviarOtp, cerrarSesionAction. Cada una valida con Zod, usa password/otp/session, y devuelve `{ error }` o redirige. Registro: crea Usuario (hash), envía OTP de verificación, guarda correo en cookie temporal, redirige a `/verificar`. Login: verifica credenciales; si `correoVerificado` es false, reenvía OTP y redirige a `/verificar`; si ok, crea sesión y redirige a `/dashboard`. verificarOtp: valida OTP, marca `correoVerificado=true`, crea sesión, redirige a `/dashboard`.

- [ ] **Step 2: Commit** (`v0.0.6` — server actions de auth).

---

## Task 6: Pantallas de auth

**Files:** Create `app/(auth)/layout.tsx`, `registro/page.tsx`, `login/page.tsx`, `verificar/page.tsx`. Add shadcn `input`, `label`: `npx shadcn@latest add input label`.

- [ ] **Step 1: Pantallas** con la identidad de marca (centradas, sol verde, formularios con Input/Label/Button). Registro con botón "Generar contraseña" (llama `generarContrasena`) y muestra los requisitos. Verificar con input de 6 dígitos y botón "Reenviar código". Mostrar errores de validación.

- [ ] **Step 2: Verificación visual** `npm run dev` → recorrer registro → consola muestra OTP → verificar → dashboard.

- [ ] **Step 3: Commit** (`v0.0.7` — pantallas de auth).

---

## Task 7: Layout protegido + bottom nav

**Files:** Create `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `components/bottom-nav.tsx`.

- [ ] **Step 1: Layout protegido** `app/(app)/layout.tsx`: llama `obtenerUsuario()`; si null, `redirect("/login")`. Renderiza children + `<BottomNav/>`.

- [ ] **Step 2: Bottom nav** con enlaces e iconos Lucide: Inicio (`/dashboard`), Sanes (`/sanes`), Calculadora (`/calculadora`), Notificaciones (`/notificaciones`), Perfil (`/perfil`). Resalta la ruta activa. Las rutas aún no existentes son placeholders.

- [ ] **Step 3: Dashboard placeholder** que saluda al usuario por su correo y tiene botón de cerrar sesión (llama `cerrarSesionAction`).

- [ ] **Step 4: Verificación** build + tests + recorrido manual. Commit (`v0.0.8` — layout protegido + bottom nav). Actualizar CHANGELOG agrupando el Bloque 1.

---

## Decisiones abiertas
- SMTP real: pendiente de los datos de Luis (mientras, OTP a consola).
- Rate limiting de intentos de login/OTP: básico ahora (contar intentos), reforzar después.
- Middleware de protección de rutas: por ahora chequeo en el layout `(app)`; se puede mover a `middleware.ts` si crece.

## Self-Review
- **Spec coverage (§14):** correo+contraseña ✓ (T2,T4), política segura + generador ✓ (T2), OTP por correo ✓ (T3,T4), sesión ✓ (T4), pantallas ✓ (T6), bottom nav + protegido ✓ (T7). Login con wallet y combinables → Bloque 7 (modelo preparado).
- **Placeholders:** código real en password/otp/session/validations; pantallas y actions descritas con su comportamiento concreto.
- **Type consistency:** `OtpProposito` (enum Prisma) usado en otp.ts; `obtenerUsuario`/`crearSesion`/`cerrarSesion` coherentes entre session.ts, actions y layout.
