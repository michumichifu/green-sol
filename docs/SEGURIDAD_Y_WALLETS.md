# Seguridad y wallets — Green Sol

- **Versión:** 0.1
- **Fecha:** 2026-05-29

> La confianza es el producto. Green Sol gana usuarios precisamente porque **no custodia el dinero de nadie**. Este documento explica los modelos de custodia, por qué elegimos el no-custodial, cómo funciona el bote de grupo de forma segura, y un checklist para la fase de desarrollo.

---

## 1. Tres modelos de custodia (en lenguaje llano)

| Modelo | ¿Quién controla las llaves? | Riesgo | Uso en Green Sol |
| --- | --- | --- | --- |
| **Custodial** | La aplicación guarda la llave secreta del usuario. | Alto: si nos hackean o desaparecemos, el dinero se pierde. Además, guardar dinero ajeno está **regulado por ley**. | **NO se usa.** |
| **No-custodial embebida** | El usuario, mediante una llave dividida (MPC/TEE). Ni la app ni el proveedor tienen la llave completa. | Bajo. Experiencia fácil (correo), custodia real del usuario. | **Sí.** Wallet personal creada con el correo. |
| **Externa** | El usuario, con su propia wallet (Phantom, Solflare). | Bajo. El usuario ya la gestiona. | **Sí.** Para conectar/importar y para el "modo espejo". |

## 2. La regla de oro

**Green Sol nunca tiene la llave secreta del dinero de un usuario ni la del bote de un grupo.** Esto no es un detalle técnico: es la decisión que sostiene todo el producto.

Por qué importa:

- **Confianza:** el usuario no tiene que creernos. Aunque desconfíe de la plataforma, su dinero no está en nuestras manos.
- **Legal:** custodiar dinero de terceros es una actividad regulada (licencias, cumplimiento). Al no custodiar, evitamos esa carga.
- **Seguridad:** no podemos perder lo que no guardamos. No somos un objetivo jugoso para un ataque.

> Aclaración importante que surgió en el diseño: "que la app gestione el bote pero sin entregar la llave a nadie" suena bien, pero si la app **puede mover los fondos**, entonces la app **controla la llave** y es custodial de facto. La forma correcta de lograr "administradores que aprueban, sin que la app custodie" es la **multifirma** (sección 4).

## 3. Cómo funciona la wallet embebida (sin tecnicismos)

El usuario se registra con su correo y, por detrás, se crea una wallet **no-custodial**. La magia está en que la llave **no existe completa en ningún solo lugar**: se parte en pedazos con técnicas de criptografía (MPC — cómputo multiparte — o entornos seguros TEE). Para firmar una operación se combinan los pedazos en el momento, sin que nadie —ni la app, ni el proveedor— llegue a tener la llave entera.

Resultado: la comodidad de "entrar con correo y contraseña" con la seguridad de que el usuario mantiene la custodia. Proveedores que ofrecen esto: Privy, Web3Auth, Turnkey (ver [ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md)).

## 4. El bote de grupo: multifirma (multisig)

El corazón de Green Sol es el ahorro en grupo, y aquí la seguridad lo es todo. El bote es una wallet **multifirma**:

- Mover fondos **requiere varias aprobaciones** (por ejemplo, 2 de 3 administradores deben firmar un retiro).
- **No existe una sola llave** que entregar o robar: hay varias, repartidas entre los administradores.
- **Ni la app ni un solo administrador** pueden vaciar el bote por su cuenta.

Esto da exactamente lo que se diseñó —administradores que aprueban envíos/retiros— pero con custodia repartida y transparente. En Solana no hace falta construir esto desde cero: existen protocolos de multifirma probados y auditados (por ejemplo, **Squads**) que se pueden integrar.

## 5. Modo espejo (solo lectura)

Para los más desconfiados: el grupo usa **su propia wallet externa** y Green Sol solo **lee y refleja** los datos (saldo, aportes, quién puso qué) consultando la red. La app no firma ni mueve nada. Cero custodia, cero riesgo. La atribución de "quién aportó" funciona mejor si los aportes salen desde direcciones de usuarios registrados.

## 6. Flujos de seguridad

- **Onboarding (correo + contraseña):** contraseñas con hash fuerte (bcrypt/argon2), verificación de correo, límite de intentos de login.
- **Recuperación de cuenta:** según el proveedor de wallet embebida (factores de recuperación, MFA). Documentar el mecanismo y sus límites para el usuario.
- **Importar/conectar wallet externa:** mediante el estándar Wallet Adapter. Si se permite importar por llave secreta, hacerlo del lado del cliente, con advertencias claras, y **nunca enviar la llave al servidor**.
- **Firma de transacciones:** siempre la hace la wallet del usuario. Antes de firmar, **simular la transacción** y mostrar en lenguaje claro qué va a pasar (cuánto sale, a dónde).
- **Exportar la llave embebida:** permitido, con advertencias fuertes; a partir de ahí la custodia es 100% del usuario.

## 7. Buenas prácticas técnicas

- **Secretos en variables de entorno**, nunca en el código ni en el repositorio (`.env` está en `.gitignore`).
- **RPC con rate limiting** y proveedor dedicado; no exponer la API key del RPC en el frontend si se puede evitar.
- **Validar y simular** toda transacción antes de pedir firma.
- **Anti-phishing:** dominio claro, avisos, nunca pedir la frase semilla dentro de la app.
- **No registrar (log) datos sensibles**: ni llaves, ni montos asociados a identidades sin necesidad.
- **Archivos (audio/imágenes)** en object storage con permisos correctos; no on-chain.

## 8. Checklist de seguridad (fase de desarrollo)

- [ ] No existe ningún punto donde la app guarde la llave secreta de un usuario o del bote.
- [ ] El bote de grupo usa multifirma (o está claramente en modo espejo/solo lectura).
- [ ] Las contraseñas se almacenan con hash fuerte.
- [ ] Secretos solo en variables de entorno; `.env` ignorado por git.
- [ ] RPC dedicado, con límites; la key no queda expuesta innecesariamente.
- [ ] Toda transacción se simula y se muestra en lenguaje claro antes de firmar.
- [ ] La frase semilla / llave nunca viaja al servidor ni se registra en logs.
- [ ] Verificación de correo y límite de intentos de login activos.
- [ ] Todo el MVP probado en devnet antes de tocar mainnet.
