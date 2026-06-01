# Autenticación con PIN — Diseño

**Fecha:** 2026-06-01
**Autor:** Luis (Green Sol) + Claude
**Estado:** Aprobado (diseño), pendiente plan de implementación

## Contexto y motivación

Inspirado en **Cashea** (app venezolana de cuotas, retail-first), que simplifica al máximo el registro/login para audiencia masiva. El insight clave: para retail venezolano, una **contraseña alfanumérica compleja** (mayúscula + número + símbolo) es fricción que reduce la conversión. Cashea usa un **PIN numérico de 6 dígitos** como credencial, fácil de recordar.

Green Sol adopta el mismo enfoque, manteniendo la seguridad donde importa (el dinero/cripto).

## Decisiones clave (acordadas)

1. **El PIN de 6 dígitos numérico es la credencial PRINCIPAL** (registro y login diario). Reemplaza a la contraseña alfanumérica para el uso normal.
2. **La contraseña pasa a ser un FACTOR FUERTE OPCIONAL**, que se pide **solo para retiros cripto** (y otras acciones de dinero a futuro). Su alternativa será la **biometría** (WebAuthn, futuro). Cualquiera de las dos sirve.
3. **Seguridad del PIN:** como son solo 1M de combinaciones, se añade **bloqueo temporal tras 5 intentos fallidos** (15 minutos) contra fuerza bruta. El PIN se hashea con **Argon2** (igual que hoy la contraseña), nunca en claro.
4. **Migración suave:** los usuarios existentes (que tienen contraseña pero no PIN) verán una pantalla **"Crea tu PIN"** la primera vez que entren; su contraseña se conserva como factor fuerte.
5. **El factor fuerte para cripto** (pedir contraseña/biometría en retiros) se implementa **cuando se construya la capa Solana/DevNet** (hoy no hay retiros que proteger). Esta spec solo deja el modelo y el concepto listos.
6. La **estética actual** de las pantallas de auth se mantiene (no copiamos el estilo de Cashea, solo la lógica del flujo).

## Modelo de datos (Prisma)

Reusa los campos existentes en `Usuario`, cambiando su rol; añade campos para el bloqueo:

```prisma
// pinHash: ya existe (era 2FA) → ahora es la credencial PRINCIPAL.
// hashContrasena: ya existe (era login) → ahora factor fuerte OPCIONAL (cripto).
pinIntentos     Int       @default(0)   // intentos fallidos consecutivos de PIN
pinBloqueadoHasta DateTime?              // si está en el futuro, el login por PIN está bloqueado
```

- `pinHash` pasa de opcional-2FA a **la credencial de login** (sigue siendo `String?` en el schema porque un usuario recién migrado puede no tenerlo aún, pero funcionalmente es requerido para entrar).
- `hashContrasena` se mantiene `String?` (opcional): factor fuerte para cripto.
- Se elimina el uso de `otpCorreoActivo`/PIN como "2FA opcional" en `verificarFactores` para el login (el PIN ya es el login). `verificarFactores` queda para el futuro modal de acciones sensibles.

## Validación del PIN

- Exactamente **6 dígitos numéricos** (`/^\d{6}$/`).
- Hash con **Argon2** (`hashContrasena()` de `lib/auth/password.ts` sirve, es genérico).
- Se rechazan PINs triviales obvios (opcional, simple): `000000`, `123456`, `111111`, etc. (lista corta). YAGNI: incluirlo si es barato.

## Flujo de registro

Orden: **correo → verificar código (OTP) → crear PIN → datos → completado**.

1. **Correo:** el usuario ingresa su correo. Se valida formato y que no exista una cuenta **verificada** con ese correo. Se envía el **OTP** (con la plantilla de marca ya conectada) y se pasa a la pantalla de verificación.
2. **Verificar código (OTP):** pantalla "Te enviamos un código a tu correo, revísalo". El usuario ingresa los 6 dígitos. Al validar, el **correo queda verificado** y se guarda en un estado temporal de registro (cookie firmada de corta duración, p. ej. `registro_pendiente` con el correo verificado).
3. **Crear PIN:** teclado/inputs numéricos. Ingresa el PIN (6 dígitos) y lo **confirma** (segundo campo). Validación de que coinciden y cumplen el formato.
4. **Datos:** nombre, apellido, nombre de usuario (con validación de disponibilidad en vivo, case-insensitive) y país — **igual que hoy**.
5. **Crear cuenta:** se crea el `Usuario` con `correoVerificado = true`, `pinHash`, y los datos. Se limpia el estado temporal.
6. **Pantalla "¡Registro completado!"**: confirmación visual ("Felicidades, tu cuenta está lista") con botón **"Iniciar sesión"** (no se redirige directo al login, que confunde).
7. **Pop-up de biometría (visual):** "Usaremos tu biometría para mayor seguridad" con botón **"Entendido"**. Es solo informativo; la configuración real de biometría (WebAuthn) es futura.

## Flujo de login

Orden: **correo → PIN**.

1. **Correo:** el usuario ingresa correo o usuario, avanza.
2. **PIN:** pantalla con teclado numérico de 6 dígitos. El usuario ingresa el PIN.
   - Si correcto: crea sesión y entra (al dashboard u onboarding según corresponda).
   - Si incorrecto: incrementa `pinIntentos`. Al llegar a **5**, fija `pinBloqueadoHasta = ahora + 15 min` y muestra "Demasiados intentos, espera 15 minutos". Mientras esté bloqueado, no acepta PIN.
   - Al acertar, `pinIntentos` se resetea a 0.
3. **(Opcional) auto-validar al 6º dígito:** el cliente puede disparar la validación automáticamente al completar el sexto dígito (detalle pro de Cashea). Fácil de sumar.
4. **"¿Olvidaste tu PIN?"**: enlace al flujo de recuperación. **Recuperación de PIN queda fuera de alcance de esta iteración** (se diseñará aparte: por correo, y a futuro cédula/teléfono como Cashea). Por ahora, el enlace puede llevar al reseteo por correo existente o mostrarse como "Pronto".

## Migración de usuarios existentes

Quien tenga `hashContrasena` pero **no** `pinHash`:

1. Al iniciar sesión (ingresa correo → en vez de pedir PIN, detecta que no tiene PIN) se le muestra **"Crea tu PIN"**: primero confirma su **contraseña actual** una vez (verifica identidad), luego define su PIN (6 dígitos + confirmar).
2. Se guarda `pinHash`. La `hashContrasena` se **conserva** como su factor fuerte para cripto.
3. A partir de ahí entra siempre con PIN.

Esto cubre a los usuarios actuales (los 2 personales de Luis y cualquier tester) sin dejar a nadie fuera.

## Factor fuerte para cripto (fuera de alcance ahora)

Cuando se construya la capa Solana/DevNet: las acciones de **retiro cripto** (y otras de dinero) pedirán confirmar con la **contraseña** (`hashContrasena`) o **biometría** (WebAuthn). Es el "modal de verificación con jerarquía" ya planeado. Esta spec deja el campo `hashContrasena` con ese rol; no se implementa el modal aquí.

## Componentes afectados

- `prisma/schema.prisma` — campos `pinIntentos`, `pinBloqueadoHasta`; migración.
- `lib/auth/pin.ts` (nuevo) — validar formato, hashear/verificar PIN, lógica de intentos/bloqueo.
- `lib/validations/auth.ts` — schema del PIN; el registro ya no pide contraseña.
- `app/(auth)/actions.ts` — `iniciarSesion` (con PIN + bloqueo), `registrarse` (con PIN), estado temporal de correo verificado, migración (crear PIN).
- `app/(auth)/login/page.tsx` — pantalla correo → PIN (teclado numérico).
- `app/(auth)/registro/page.tsx` — pasos correo → OTP → PIN → datos.
- `app/(auth)/verificar/page.tsx` — OTP (puede reusarse, ahora antes del PIN).
- Pantallas nuevas: **registro completado**, **pop-up biometría (visual)**, **crear PIN (migración)**.
- `components/campo-pin.tsx` (nuevo) — input de 6 dígitos con teclado numérico, reutilizable (login, registro, migración).

## Fuera de alcance (futuro)

- **Recuperación de PIN** (por correo, cédula, teléfono — estilo Cashea).
- **Biometría real** (WebAuthn/passkeys) como factor fuerte.
- **Verificación de teléfono** (+58, código) en el registro.
- El **modal de confirmación para retiros cripto** (se hace con la capa Solana).
- Auto-validación al 6º dígito (nice-to-have, opcional en la implementación).

## Seguridad y notas

- El PIN nunca viaja ni se guarda en claro; Argon2.
- Bloqueo por intentos contra fuerza bruta (5 intentos → 15 min).
- El estado temporal de "correo verificado" en el registro usa una cookie firmada de corta duración, no confiable para nada más que ese flujo.
- Trade-off asumido y mitigado: PIN (1M combinaciones) para conveniencia retail; el dinero (cripto) queda detrás de un factor fuerte adicional.
